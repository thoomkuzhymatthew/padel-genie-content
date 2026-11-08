import { readFile } from 'node:fs/promises';
import { generateJson } from './llm.js';
import { AtomsSchema } from './schemas/atom.js';
import { verifyAtoms } from './verify.js';
import type { Source } from './ingest.js';
export async function atomise(source: Source) {
  const prompt = await readFile(new URL('./prompts/extract.md', import.meta.url), 'utf8');
  const context = { title: source.title, url: source.url, date: source.date, text: source.text };
  const result = await generateJson('extract', AtomsSchema, prompt, JSON.stringify(context));
  const initial = verifyAtoms(result.data.atoms, source.text, { date: source.date });
  let candidates: unknown[] = result.data.atoms;
  const attempts = [result.trace];
  let repairInput: string | null = null;
  let repairCandidates: unknown[] = [];
  if (initial.rejected.length) {
    repairInput = JSON.stringify({
      source: context, rejected_atoms: initial.rejected, accepted_ids: initial.verified.map(atom => atom.id),
      instruction: 'Return corrected replacements ONLY for rejected atoms, retaining their IDs. Drop any that cannot be proved. Do not repeat accepted IDs. You may add missing named factual narrative examples or product details with fresh IDs. Every entity must appear in the chosen quote; do not name London or Camden if only implied. All numeric claim years and street numbers must be declared in values or quoted periods, or removed from claim prose. For regional density include the full contiguous chart heading/unit and label/value sequence so 100,000 is in the SAME quote. For Homebase use the table quote for numeric 10, separately quote canopy/consent context without converting spelled-out Ten. Never loosen quote or numeric evidence rules.',
    });
    const repair = await generateJson('extract', AtomsSchema, prompt, repairInput);
    attempts.push(repair.trace);
    repairCandidates = repair.data.atoms;
    candidates = [...initial.verified, ...repairCandidates];
  }
  return { candidates, trace: { ...result.trace, attempts }, prompt,
    initialCandidates: result.data.atoms, initialRejected: initial.rejected, repairInput, repairCandidates };
}
