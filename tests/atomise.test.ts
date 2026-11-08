import { afterEach, expect, it, vi } from 'vitest';
const generate = vi.hoisted(() => vi.fn());
vi.mock('../pipeline/llm.js', () => ({ generateJson: generate }));
import { atomise } from '../pipeline/atomise.js';
import { parseSource } from '../pipeline/ingest.js';
import { verifyAtoms } from '../pipeline/verify.js';
afterEach(() => generate.mockReset());
const source = parseSource('July applications were revised from 63 to 93.', 'source.md', 'markdown');
const valid = { id: 'a1', kind: 'narrative', entities: ['July'], certainty: 'reported', claim: source.text, source_quote: source.text, place: null, values: [{ value: 93, compare: 63, unit: 'applications', period: 'July', period_source: 'quote' }] };
const response = (atoms: unknown[]) => ({ data: { atoms }, trace: { requested_model: 'offline-test' } });
it('retains rejected extraction evidence and verifies a bounded correction', async () => {
  generate.mockResolvedValueOnce(response([{ ...valid, values: [{ ...valid.values[0], compare: 62 }] }]))
    .mockResolvedValueOnce(response([valid]));
  const result = await atomise(source);
  expect(result.initialRejected).toHaveLength(1);
  expect(result.trace.attempts).toHaveLength(2);
  expect(result.repairInput).toContain('compare_not_in_quote');
  expect(verifyAtoms(result.candidates, source.text).verified).toHaveLength(1);
});
it('does not loop or let an invalid correction bypass verification', async () => {
  generate.mockResolvedValue(response([{ ...valid, source_quote: 'Invented.' }]));
  const result = await atomise(source);
  expect(generate).toHaveBeenCalledTimes(2);
  expect(verifyAtoms(result.candidates, source.text).verified).toHaveLength(0);
});
