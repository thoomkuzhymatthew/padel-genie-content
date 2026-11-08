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

import { checkGraphicEvidence, validateFields } from '../pipeline/render.js';
import { loadCatalogue } from '../pipeline/catalogue.js';
import { fieldValues, fillTemplate } from '../pipeline/template.js';
import type { Atom } from '../pipeline/schemas/atom.js';
it('expands arrays and escapes text while preserving field paths', () => {
  const content = { rows: [{ label: '<script>alert(1)</script>', value: 12 }, { label: 'Safe', value: 10 }] };
  expect(fieldValues(content, 'rows[].value')).toEqual([12, 10]);
  expect(fillTemplate('{{#each rows}}<p>{{label}}: {{value}}</p>{{/each}}', content)).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;: 12</p><p>Safe: 10</p>');
});
it('checks region/value pairs, the average and coverage of all published regions', async () => {
  const draft = JSON.parse(await readFile('reports/milestone-4/regional-court-supply.draft.json', 'utf8'));
  const atoms: Atom[] = JSON.parse(await readFile('reports/playbook-v2/october/atoms.verified.json', 'utf8'));
  expect(() => checkGraphicEvidence('ranked-bars', draft.content, atoms)).not.toThrow();
  const wrongValue = structuredClone(draft.content); wrongValue.items[0].value = 6.48;
  expect(() => checkGraphicEvidence('ranked-bars', wrongValue, atoms)).toThrow('Region/value');
  const wrongAverage = structuredClone(draft.content); wrongAverage.average = 3.8;
  expect(() => checkGraphicEvidence('ranked-bars', wrongAverage, atoms)).toThrow('GB average');
  const missingRegion = structuredClone(draft.content); missingRegion.items.pop();
  expect(() => checkGraphicEvidence('ranked-bars', missingRegion, atoms)).toThrow('Published region missing');
});
it('checks comparison direction, units and provisional caveat', async () => {
  const draft = JSON.parse(await readFile('reports/milestone-4/pipeline-year-on-year.draft.json', 'utf8'));
  const atoms: Atom[] = JSON.parse(await readFile('reports/playbook-v2/august/atoms.verified.json', 'utf8'));
  expect(() => checkGraphicEvidence('comparison', draft.content, atoms)).not.toThrow();
  for (const mutate of [
    (value: typeof draft.content) => { value.left.hero = '649'; value.right.hero = '312'; },
    (value: typeof draft.content) => { value.rows[0].label = 'Courts approved'; },
    (value: typeof draft.content) => { value.left.label = 'Year to August 2026'; value.right.label = 'Year to August 2025'; },
    (value: typeof draft.content) => { value.context = 'Latest totals.'; },
  ]) {
    const wrong = structuredClone(draft.content); mutate(wrong);
    expect(() => checkGraphicEvidence('comparison', wrong, atoms)).toThrow();
  }
});
it('applies carousel field and slide limits to every content slide', async () => {
  const draft = JSON.parse(await readFile('reports/milestone-4/padel-reuses-old-buildings.draft.json', 'utf8'));
  const template = (await loadCatalogue('templates')).find(item => item.name === 'carousel-basic')!;
  expect(() => validateFields(draft.content, template)).not.toThrow();
  draft.content.content_slides[1].body = 'x'.repeat(181);
  expect(() => validateFields(draft.content, template)).toThrow('Field exceeds limit');
});
