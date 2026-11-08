import { afterEach, expect, it, vi } from 'vitest';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const generate = vi.hoisted(() => vi.fn());
vi.mock('../pipeline/llm.js', () => ({ generateJson: generate }));
import { writeDraft } from '../pipeline/write.js';
import { sha256 } from '../pipeline/ingest.js';
const temporary: string[] = [];
afterEach(async () => { generate.mockReset(); await Promise.all(temporary.splice(0).map(dir => rm(dir, { recursive: true, force: true }))); });
async function destination() { const dir = await mkdtemp(join(tmpdir(), 'pg-copy-')); temporary.push(dir); return join(dir, 'draft.json'); }
function stub(mode: 'valid' | 'number' | 'hero') {
  generate.mockImplementation(async (_stage, _schema, _system, input: string) => {
    const payload = JSON.parse(input);
    return { data: {
      fields: mode === 'hero' ? [{ path: 'hero', text: '999' }] : payload.editable_fields,
      caption: mode === 'number' ? '999 new courts.' : payload.selected_draft.caption,
    }, trace: { stage: 'copy', input_sha256: sha256(input) } };
  });
}
it('keeps factual fields fixed and records the actual generation-input hash', async () => {
  stub('valid'); const output = await destination();
  await writeDraft('reports/milestone-4/july-revision.seed.json', output);
  const result = JSON.parse(await readFile(output, 'utf8'));
  expect(result.content.hero).toBe('93'); expect(result.content.comparison).toContain('63');
  const trace = JSON.parse(await readFile(output + '.copy-trace.json', 'utf8'));
  expect(trace.input_sha256).toBe(sha256(generate.mock.calls[0][3]));
  expect(trace.context_input_sha256).not.toBe(trace.input_sha256);
});
it.each(['number', 'hero'] as const)('rejects unsafe %s copy', async mode => {
  stub(mode); const output = await destination();
  await expect(writeDraft('reports/milestone-4/july-revision.seed.json', output)).rejects.toThrow();
});
it('repairs one unsafe copy attempt and still verifies the replacement',async()=>{
 let attempt=0;generate.mockImplementation(async(_stage,_schema,_system,input:string)=>{const payload=JSON.parse(input);return{data:{fields:payload.editable_fields,caption:attempt++===0?'999 new courts.':payload.selected_draft.caption},trace:{stage:'copy',input_sha256:sha256(input)}};});
 const output=await destination();await writeDraft('reports/milestone-4/july-revision.seed.json',output,{repair:true});expect(generate).toHaveBeenCalledTimes(2);const trace=JSON.parse(await readFile(output+'.copy-trace.json','utf8'));expect(trace.attempts).toHaveLength(2);expect(JSON.parse(await readFile(output,'utf8')).caption).not.toContain('999');
});
