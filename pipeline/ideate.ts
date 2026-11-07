import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { generateJson } from './llm.js';
import { assemblePrompt } from './prompt.js';
import { IdeasSchema, IdeaSchema, type Idea } from './schemas/idea.js';
import type { Atom } from './schemas/atom.js';
import { numericTokens } from './verify.js';
import { sha256, type Source } from './ingest.js';
import type { Template } from './catalogue.js';

export function validateIdeas(candidates: readonly unknown[], atoms: Atom[], catalogue: Template[]) {
  const verified: Idea[] = [];
  const rejected: { idea: unknown; reasons: string[] }[] = [];
  const byId = new Map(atoms.map(atom => [atom.id, atom]));
  const ids = new Set<string>();
  for (const candidate of candidates) {
    const parsed = IdeaSchema.safeParse(candidate);
    if (!parsed.success) { rejected.push({ idea: candidate, reasons: ['invalid_idea_schema'] }); continue; }
    const idea = parsed.data, reasons: string[] = [];
    if (ids.has(idea.id)) reasons.push('duplicate_idea_id');
    ids.add(idea.id);
    if (new Set(idea.atoms).size !== idea.atoms.length) reasons.push('duplicate_atom_reference');
    if (idea.atoms.some(id => !byId.has(id))) reasons.push('unknown_atom_reference');
    const template = catalogue.find(item => item.name === idea.template);
    if (!template || template.format !== idea.format) reasons.push('unknown_template_or_format');
    const allowed = idea.atoms.flatMap(id => byId.get(id)?.values.flatMap(v => [v.value, ...(v.compare === null ? [] : [v.compare]), ...numericTokens(v.period ?? '')]) ?? []);
    for (const field of ['story', 'hold_back', 'why_it_works'] as const) {
      if (numericTokens(idea[field]).some(n => !allowed.includes(n))) reasons.push(`unsupported_number:${field}`);
    }
    if (reasons.length) rejected.push({ idea: candidate, reasons }); else verified.push(idea);
  }
  return { verified, rejected };
}

export async function ideateRun(directory: string) {
  const source = JSON.parse(await readFile(join(directory, 'source.json'), 'utf8')) as Source;
  const atoms: unknown = JSON.parse(await readFile(join(directory, 'atoms.verified.json'), 'utf8'));
  if (!Array.isArray(atoms)) throw new Error('Invalid atom handoff');
  const assembled = await assemblePrompt(source, atoms);
  const stagePrompt = await readFile(new URL('./prompts/ideate.md', import.meta.url), 'utf8');
  const schema = IdeasSchema.extend({ ideas: z.array(IdeaSchema.extend({
    template: z.enum(assembled.catalogue.map(item => item.name) as [string, ...string[]]),
    format: z.enum([...new Set(assembled.catalogue.map(item => item.format))] as [string, ...string[]]),
  })).max(8) });
  const result = await generateJson('ideate', schema, assembled.system, assembled.input);
  let candidates: unknown[] = result.data.ideas;
  let checked = validateIdeas(candidates, assembled.atoms, assembled.catalogue);
  const json = (file: string, value: unknown) => writeFile(join(directory, file), JSON.stringify(value, null, 2) + '\n');
  await json('ideas.initial.candidates.json', candidates);
  await json('ideas.initial.rejected.json', checked.rejected);
  const attempts = [result.trace];
  if (checked.rejected.length) {
    const repairInput = JSON.stringify({
      source_and_atoms: JSON.parse(assembled.input),
      accepted_ideas: checked.verified,
      rejected_ideas: checked.rejected,
      instruction: 'Return replacements ONLY for rejected ideas, preserving their IDs. Fix validation reasons using exact supported numbers and valid catalogue formats. Do not round 3061 to 3000 or convert spelled-out source numbers into unsupported digits. Do not repeat accepted ideas. Fewer ideas are allowed if evidence is insufficient.',
    });
    await writeFile(join(directory, 'ideate.repair.input.json'), repairInput + '\n');
    const repair = await generateJson('ideate', schema, assembled.system, repairInput);
    attempts.push(repair.trace);
    await json('ideas.repair.candidates.json', repair.data.ideas);
    candidates = [...checked.verified, ...repair.data.ideas.slice(0, 8 - checked.verified.length)];
    checked = validateIdeas(candidates, assembled.atoms, assembled.catalogue);
  }
  await json('ideas.candidates.json', candidates);
  await json('ideas.json', checked.verified);
  await json('ideas.rejected.json', checked.rejected);
  await json('ideate.trace.json', { ...result.trace, attempts, ...assembled.provenance, stage_prompt_sha256: sha256(stagePrompt), validator_sha256: sha256(await readFile(new URL('./ideate.ts', import.meta.url), 'utf8')) });
  await writeFile(join(directory, 'ideate.system.md'), assembled.system);
  await writeFile(join(directory, 'ideate.input.json'), assembled.input + '\n');
  console.log(`Ideation: ${checked.verified.length} accepted, ${checked.rejected.length} rejected. ${directory}`);
  for (const rejection of checked.rejected) console.log(JSON.stringify(rejection));
  if (!checked.verified.length) throw new Error('No valid ideas; human review required before proceeding');
  return checked;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { run: { type: 'string' } }, strict: true });
    if (!values.run) throw new Error('Usage: npm run ideate -- --run runs/<run-id>');
    await ideateRun(resolve(values.run));
  } catch (error) { console.error(error instanceof z.ZodError ? 'Invalid source or configuration schema' : error instanceof Error ? error.message : 'Ideation failed'); process.exitCode = 1; }
}
