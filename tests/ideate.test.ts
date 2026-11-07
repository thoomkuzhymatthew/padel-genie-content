import { afterEach, expect, it, vi } from 'vitest';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const generate = vi.hoisted(() => vi.fn());
vi.mock('../pipeline/llm.js', () => ({ generateJson: generate }));
import { ideateRun } from '../pipeline/ideate.js';
import { parseSource } from '../pipeline/ingest.js';
const directories: string[] = [];
afterEach(async () => { generate.mockReset(); await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function fixture() {
  const directory = await mkdtemp(join(tmpdir(), 'pg-ideas-')); directories.push(directory);
  const source = parseSource('There are 151 applications.', 'source.md', 'markdown');
  await writeFile(join(directory, 'source.json'), JSON.stringify(source));
  await writeFile(join(directory, 'atoms.verified.json'), JSON.stringify([{ id: 'a1', claim: source.text, source_quote: source.text, values: [{ value: 151, compare: null, unit: 'applications', period: null }], place: 'UK' }]));
  return directory;
}
const idea = { id: 'i1', story: '151 applications.', atoms: ['a1'], format: 'stat', template: 'stat-card', hold_back: 'Inspect the planning records.', why_it_works: 'A clear statistic.', score: 8 };
const response = (ideas: unknown[]) => ({ data: { ideas }, trace: { requested_model: 'offline-test' } });
it('repairs rejected ideas once, preserves initial evidence and revalidates replacements', async () => {
  const directory = await fixture();
  generate.mockResolvedValueOnce(response([idea, { ...idea, id: 'i2', story: '999 applications.' }]))
    .mockResolvedValueOnce(response([{ ...idea, id: 'i2', story: 'Applications reached 151.' }]));
  const result = await ideateRun(directory);
  expect(generate).toHaveBeenCalledTimes(2);
  expect(result.verified).toHaveLength(2);
  expect(JSON.parse(await readFile(join(directory, 'ideas.initial.rejected.json'), 'utf8'))).toHaveLength(1);
  expect(JSON.parse(await readFile(join(directory, 'ideate.trace.json'), 'utf8')).attempts).toHaveLength(2);
  expect(await readFile(join(directory, 'ideate.repair.input.json'), 'utf8')).toContain('unsupported_number');
});
it('does not loop or accept a still-invalid repair', async () => {
  const directory = await fixture();
  const invalid = { ...idea, story: '999 applications.' };
  generate.mockResolvedValue(response([invalid]));
  await expect(ideateRun(directory)).rejects.toThrow('No valid ideas');
  expect(generate).toHaveBeenCalledTimes(2);
  expect(JSON.parse(await readFile(join(directory, 'ideas.json'), 'utf8'))).toEqual([]);
});
