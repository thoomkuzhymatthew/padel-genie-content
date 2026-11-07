import { readFile } from 'node:fs/promises';
import { generateJson } from './llm.js';
import { AtomsSchema } from './schemas/atom.js';
import type { Source } from './ingest.js';
export async function atomise(source: Source) {
  const prompt = await readFile(new URL('./prompts/extract.md', import.meta.url), 'utf8');
  const result = await generateJson('extract', AtomsSchema, prompt, JSON.stringify({
    title: source.title, url: source.url, date: source.date, text: source.text,
  }));
  return { candidates: result.data.atoms, trace: result.trace, prompt };
}
