import { parseArgs } from 'node:util';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { projectRoot } from './env.js';
import { ingest, parseSource, sha256 } from './ingest.js';
import { atomise } from './atomise.js';
import { verifyAtoms } from './verify.js';

async function main() {
  const { values } = parseArgs({ options: { url: { type: 'string' }, file: { type: 'string' }, source: { type: 'string' }, 'ingest-only': { type: 'boolean' } }, strict: true });
  if ([values.url, values.file, values.source].filter(Boolean).length !== 1) throw new Error('Usage: npm run pipeline -- --url <url> OR --file <path> OR --source <cached source.json> [--ingest-only]');
  if (values.url && !/^https?:\/\//i.test(values.url)) throw new Error('--url must be an HTTP(S) URL');
  const input = values.url || resolve(values.file || values.source!);
  const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const directory = join(projectRoot, 'runs', runId);
  await mkdir(directory, { recursive: true });
  const json = (name: string, value: unknown) => writeFile(join(directory, name), JSON.stringify(value, null, 2) + '\n');
  try {
    const loadInput = async () => {
      if (!values.source) return ingest(input);
      const cached: unknown = JSON.parse(await readFile(input, 'utf8'));
      if (!cached || typeof cached !== 'object') throw new Error('Invalid cached source');
      const previous = cached as Record<string, unknown>;
      if (!['html', 'markdown', 'csv'].includes(String(previous.format)) || typeof previous.input !== 'string' || typeof previous.raw_sha256 !== 'string') throw new Error('Invalid cached source metadata');
      const format = previous.format as 'html' | 'markdown' | 'csv';
      const raw = await readFile(join(dirname(input), `raw.${format === 'markdown' ? 'md' : format}`), 'utf8');
      if (sha256(raw) !== previous.raw_sha256) throw new Error('Cached raw source hash mismatch');
      const source = parseSource(raw, previous.input, format);
      if (typeof previous.retrieved_at === 'string') source.retrieved_at = previous.retrieved_at;
      return { raw, source };
    };
    const { source, raw } = await loadInput();
    await writeFile(join(directory, `raw.${source.format === 'markdown' ? 'md' : source.format}`), raw);
    await json('source.json', source);
    console.log(`Ingested: ${source.title} (${source.text.length} characters, date ${source.date ?? 'unknown'})`);
    if (values['ingest-only']) { console.log(`Saved: runs/${runId}`); return; }
    const { candidates, trace, prompt } = await atomise(source);
    await json('atoms.candidates.json', candidates);
    await json('extract.trace.json', trace);
    await writeFile(join(directory, 'extract.prompt.md'), prompt);
    const result = verifyAtoms(candidates, source.text);
    await json('atoms.verified.json', result.verified);
    await json('atoms.rejected.json', result.rejected);
    await json('verification.json', { ...result.totals, source_sha256: source.text_sha256, verifier_sha256: sha256(await readFile(new URL('./verify.ts', import.meta.url), 'utf8')) });
    for (const item of result.rejected) console.log(`Rejected ${item.id ?? item.index}: ${item.reasons.join(', ')}`);
    console.log(`Verified ${result.totals.verified}/${result.totals.candidates}; rejected ${result.totals.rejected}. Saved: runs/${runId}`);
    if (!result.verified.length) throw new Error('No verified atoms; downstream stages must not proceed');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Pipeline failed';
    await json('error.json', { message, created_at: new Date().toISOString() });
    throw error;
  }
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Pipeline failed'); process.exitCode = 1; });
