import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { readFile } from 'node:fs/promises';
import { requireEnv } from './env.js';
import { sha256 } from './ingest.js';

type Stage = 'extract' | 'ideate' | 'copy' | 'learn';
const ConfigSchema = z.record(z.enum(['extract', 'ideate', 'copy', 'learn']), z.strictObject({
  provider: z.literal('openai'), model: z.string().min(1), notes: z.string(),
}));
export async function generateJson<T>(stage: Stage, schema: z.ZodType<T>, system: string, input: string) {
  const config = ConfigSchema.parse(JSON.parse(await readFile(new URL('../config/models.json', import.meta.url), 'utf8')));
  const selected = config[stage];
  const client = new OpenAI({ apiKey: requireEnv('OPENAI_API_KEY'), timeout: 120_000, maxRetries: 2 });
  let response;
  try {
    response = await client.responses.parse({
      model: selected.model, store: false,
      input: [{ role: 'system', content: system }, { role: 'user', content: input }],
      text: { format: zodTextFormat(schema, `${stage}_result`) }, max_output_tokens: stage === 'extract' ? 18000 : 10000,
    });
  } catch (error) {
    // SDK errors can include credentials/request contents: log safe metadata only.
    if (error instanceof OpenAI.APIError) throw new Error(`OpenAI request failed (HTTP ${error.status ?? 'unknown'}, code ${error.code ?? 'unknown'})`);
    throw new Error('OpenAI request or structured parsing failed; no output accepted');
  }
  if (response.status !== 'completed' || response.output_parsed === null) throw new Error(`OpenAI returned ${response.status}; no complete structured output accepted`);
  return {
    data: schema.parse(response.output_parsed),
    trace: {
      stage, provider: selected.provider, requested_model: selected.model, returned_model: response.model,
      response_id: response.id, usage: response.usage, system_prompt_sha256: sha256(system),
      input_sha256: sha256(input), created_at: new Date().toISOString(),
    },
  };
}
