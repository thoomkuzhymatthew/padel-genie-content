import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { projectRoot } from './env.js';
import { generateJson } from './llm.js';
import { assemblePrompt } from './prompt.js';
import { DraftSchema, validateFields } from './render.js';
import { numericTokens } from './verify.js';
import type { Source } from './ingest.js';
import type { JsonRecord } from './template.js';
const CopySchema = z.strictObject({ fields: z.array(z.strictObject({ path: z.string(), text: z.string() })), caption: z.string() });
export async function writeDraft(inputFile: string, outputFile: string) {
  if (resolve(inputFile) === resolve(outputFile)) throw new Error('Write to a new file; do not overwrite the original draft');
  const draft = DraftSchema.parse(JSON.parse(await readFile(inputFile, 'utf8')));
  const source = JSON.parse(await readFile(join(projectRoot, draft.source_bundle, 'source.json'), 'utf8')) as Source;
  const all: JsonRecord[] = JSON.parse(await readFile(join(projectRoot, draft.source_bundle, 'atoms.verified.json'), 'utf8'));
  const selected = all.filter(atom => draft.atoms.includes(String(atom.id)));
  if (selected.length !== draft.atoms.length) throw new Error('Unknown selected atom');
  const assembled = await assemblePrompt(source, selected, projectRoot, 'write');
  const template = assembled.catalogue.find(item => item.name === draft.template);
  if (!template) throw new Error('Unknown copy template');
  const editable: { path: string; text: string }[] = [];
  // Keep numeric/structured facts fixed; the model writes only editorial text.
  for (const [key, value] of Object.entries(draft.content)) {
    if (typeof value === 'string' && !['wordmark','source_line','hero','hook_hero','closing_hero','unit','comparison_atom_id'].includes(key) && !numericTokens(value).length) editable.push({ path: key, text: value });
  }
  const generationInput = JSON.stringify({ evidence: JSON.parse(assembled.input), selected_draft: draft, editable_fields: editable });
  const result = await generateJson('copy', CopySchema, assembled.system, generationInput);
  const paths = result.data.fields.map(field => field.path);
  if (new Set(paths).size !== paths.length || paths.length !== editable.length || paths.some(path => !editable.some(field => field.path === path))) throw new Error('Copy output changed the editable field set');
  for (const field of result.data.fields) draft.content[field.path] = field.text;
  draft.caption = result.data.caption;
  validateFields(draft.content, template);
  const allowed = assembled.atoms.flatMap(atom => atom.values.flatMap(value => [value.value, ...(value.compare === null ? [] : [value.compare]), ...numericTokens(value.period ?? '')]));
  if ([...result.data.fields.map(field => field.text), draft.caption].some(text => numericTokens(text).some(number => !allowed.includes(number)))) throw new Error('Copy introduced an unverified number');
  await writeFile(outputFile, JSON.stringify(draft, null, 2) + '\n');
  await writeFile(outputFile + '.copy-trace.json', JSON.stringify({ ...assembled.provenance, ...result.trace, context_input_sha256: assembled.provenance.input_sha256, editable_paths: paths, status: 'draft_not_approved' }, null, 2) + '\n');
  console.log('Wrote: ' + outputFile);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { draft: { type: 'string' }, output: { type: 'string' } }, strict: true });
    if (!values.draft || !values.output) throw new Error('Usage: npm run write -- --draft <draft.json> --output <new-draft.json>');
    await writeDraft(resolve(values.draft), resolve(values.output));
  } catch (error) { console.error(error instanceof Error ? error.message : 'Copy failed'); process.exitCode = 1; }
}
