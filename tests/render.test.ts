import { expect, it, vi } from 'vitest';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
const launch = vi.hoisted(() => vi.fn());
vi.mock('playwright', () => ({ chromium: { launch } }));
import { renderDraft } from '../pipeline/render.js';
it.each([
  ['hero', '9,999', 'Unsupported rendered number'],
  ['source_line', 'Source: Padel Genie, November 2026', 'Source/date line'],
  ['headline', 'x'.repeat(73), 'Field exceeds limit'],
])('blocks invalid %s before starting a browser', async (field, value, error) => {
  const directory = await mkdtemp(join(tmpdir(), 'pg-render-'));
  try {
    const draft = JSON.parse(await readFile('reports/milestone-4/first-stat.draft.json', 'utf8'));
    draft.content[field] = value;
    const file = join(directory, 'draft.json');
    await writeFile(file, JSON.stringify(draft));
    await expect(renderDraft(file)).rejects.toThrow(error);
    expect(launch).not.toHaveBeenCalled();
  } finally { await rm(directory, { recursive: true, force: true }); }
});
