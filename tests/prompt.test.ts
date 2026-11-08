import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, writeFile, rm, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assemblePrompt } from '../pipeline/prompt.js';
import { loadCatalogue } from '../pipeline/catalogue.js';
import { parseSource } from '../pipeline/ingest.js';
import { validateIdeas } from '../pipeline/ideate.js';
import type { Atom } from '../pipeline/schemas/atom.js';
import type { Idea } from '../pipeline/schemas/idea.js';

const roots: string[] = [];
afterEach(async () => { await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true }))); });
const source = parseSource('# Report\nThere are 151 applications.', 'report.md', 'markdown');
const atoms: Atom[] = [{ id: 'a1', claim: 'There are 151 applications.', source_quote: 'There are 151 applications.', place: 'UK', values: [{ value: 151, compare: null, unit: 'applications', period: null, period_source: 'quote' }] }];
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'pg-prompt-')); roots.push(root);
  for (const dir of ['playbook', 'templates', 'pipeline/prompts']) await mkdir(join(root, dir), { recursive: true });
  await writeFile(join(root, 'playbook/playbook.md'), '# Padel Genie social intern — playbook v1\nBaseline voice\n<!-- LOCKED: the learning loop must never edit anything below this line -->\nHard rules');
  await writeFile(join(root, 'playbook/learnings.md'), 'No merged learnings.');
  await writeFile(join(root, 'pipeline/prompts/ideate.md'), 'Propose ideas from verified atoms only.');
  await cp('templates/stat-card', join(root, 'templates/stat-card'), { recursive: true });
  return root;
}

describe('dynamic prompt assembly', () => {
  it('assembles playbook, template fields, merged learnings and verified atoms with provenance', async () => {
    const root = await fixture();
    const result = await assemblePrompt(source, atoms, root);
    expect(result.system).toContain('Baseline voice');
    expect(result.system).toContain('max_characters');
    expect(result.system).toContain('No merged learnings.');
    expect(JSON.parse(result.input).verified_atoms[0].id).toBe('a1');
    expect(result.provenance.playbook_version).toBe('v1');
    expect(result.provenance.source_sha256).toBe(source.text_sha256);
  });
  it('automatically discovers a newly added descriptor without code changes or HTML', async () => {
    const root = await fixture();
    const original = await assemblePrompt(source, atoms, root);
    const descriptor = JSON.parse(await readFile('templates/stat-card/template.json', 'utf8'));
    descriptor.name = 'new-template';
    await mkdir(join(root, 'templates/new-template'));
    await writeFile(join(root, 'templates/new-template/template.json'), JSON.stringify(descriptor));
    const changed = await assemblePrompt(source, atoms, root);
    expect(changed.catalogue.map(t => t.name)).toEqual(['new-template', 'stat-card']);
    expect(changed.provenance.catalogue_sha256).not.toBe(original.provenance.catalogue_sha256);
  });
  it('reads playbook and learnings fresh each run', async () => {
    const root = await fixture();
    const original = await assemblePrompt(source, atoms, root);
    await writeFile(join(root, 'playbook/learnings.md'), 'Merged preference: shorter hooks.');
    const playbookPath = join(root, 'playbook/playbook.md');
    await writeFile(playbookPath, (await readFile(playbookPath, 'utf8')).replace('v1', 'v2'));
    const changed = await assemblePrompt(source, atoms, root);
    expect(changed.system).toContain('shorter hooks');
    expect(changed.provenance.playbook_version).toBe('v2');
    expect(changed.provenance.learnings_sha256).not.toBe(original.provenance.learnings_sha256);
    expect(changed.provenance.system_prompt_sha256).not.toBe(original.provenance.system_prompt_sha256);
  });
  it('fails closed for unverified handoffs, empty handoffs and modified source text', async () => {
    const root = await fixture();
    await expect(assemblePrompt(source, [{ ...atoms[0], source_quote: 'Made up.' }], root)).rejects.toThrow('fully verified');
    await expect(assemblePrompt(source, [], root)).rejects.toThrow('fully verified');
    await expect(assemblePrompt({ ...source, text: 'Modified.' }, atoms, root)).rejects.toThrow('hash mismatch');
  });
  it('requires valid descriptors and a non-empty catalogue', async () => {
    const root = await fixture();
    await writeFile(join(root, 'templates/stat-card/template.json'), '{}');
    await expect(loadCatalogue(join(root, 'templates'))).rejects.toThrow();
    await rm(join(root, 'templates/stat-card'), { recursive: true });
    await expect(loadCatalogue(join(root, 'templates'))).rejects.toThrow('empty');
  });
  it('requires a version and locked rules marker', async () => {
    const root = await fixture();
    await writeFile(join(root, 'playbook/playbook.md'), '# Unversioned playbook');
    await expect(assemblePrompt(source, atoms, root)).rejects.toThrow('locked rules');
  });
});

describe('ideation evidence gate', () => {
  const idea: Idea = { id: 'i1', story: '151 applications show the scale of the pipeline.', atoms: ['a1'], format: 'stat', template: 'stat-card', hold_back: 'Explore the planning records in Padel Genie.', why_it_works: 'A concrete view of the pipeline.', score: 8.5, rank: 1, main_atoms: ['a1'], hold_back_atoms: ['a1'], named_examples: [], angle: 'pipeline', improve: 'Add a supported named example.' };
  it('accepts an idea grounded in selected verified atoms and a known template', async () => {
    const catalogue = await loadCatalogue('templates');
    expect(validateIdeas([idea], atoms, catalogue).verified).toHaveLength(1);
  });
  it('rejects invented atom IDs, formats, templates, invalid scores and duplicate IDs', async () => {
    const catalogue = await loadCatalogue('templates');
    for (const patch of [{ atoms: ['unverified'] }, { format: 'video' }, { template: 'uk-map' }, { score: 11 }, { atoms: ['a1', 'a1'] }]) {
      expect(validateIdeas([{ ...idea, ...patch }], atoms, catalogue).verified).toHaveLength(0);
    }
    expect(validateIdeas([idea, idea], atoms, catalogue).rejected).toHaveLength(1);
  });
  it('rejects unsupported story and hold-back numbers, even if another unused atom has them', async () => {
    const catalogue = await loadCatalogue('templates');
    const unused = { ...atoms[0], id: 'a2', values: [{ ...atoms[0].values[0], value: 999 }] };
    for (const patch of [{ story: '999 courts.' }, { hold_back: 'Find 999 addresses in Padel Genie.' }, { why_it_works: 'A 999% increase.' }]) {
      expect(validateIdeas([{ ...idea, ...patch }], [...atoms, unused], catalogue).verified).toHaveLength(0);
    }
  });
  it('preserves the locked rules from section 7 while applying the v2 human steer', async () => {
    const brief = await readFile('agents.md', 'utf8');
    const baseline = brief.match(/### First draft of `playbook\/playbook.md`\n\n```markdown\n([\s\S]*?)\n```/)?.[1] ?? '';
    const playbook = await readFile('playbook/playbook.md', 'utf8');
    const marker = '<!-- LOCKED: the learning loop must never edit anything below this line -->';
    expect(playbook.slice(playbook.indexOf(marker)).trim()).toBe(baseline.slice(baseline.indexOf(marker)).trim());
    expect(playbook).toContain('playbook v3');
    expect(playbook).toContain('First human steer');
  });});

it('permits quoted period numerals while still restricting them to selected atoms', async () => {
  const catalogue = await loadCatalogue('templates');
  const dated = { ...atoms[0], values: [{ ...atoms[0].values[0], period: 'last 12 months' }] };
  const idea: Idea = { id: 'i1', story: '151 applications in the last 12 months.', atoms: ['a1'], format: 'stat', template: 'stat-card', hold_back: 'Explore the planning records.', why_it_works: 'Clear scope.', score: 8, rank: 1, main_atoms: ['a1'], hold_back_atoms: ['a1'], named_examples: [], angle: 'pipeline', improve: 'Add a supported named example.' };
  expect(validateIdeas([idea], [dated], catalogue).verified).toHaveLength(1);
  expect(validateIdeas([idea], atoms, catalogue).verified).toHaveLength(0);
});

describe('v2 editorial gates', () => {
  const base: Idea = {
    id: 'i1', story: '151 applications in Carlisle.', atoms: ['a1'], main_atoms: ['a1'],
    named_examples: ['Carlisle'], hold_back_atoms: ['a1'], angle: 'reuse',
    format: 'stat', template: 'stat-card', hold_back: 'Carlisle applications on the planning map.',
    why_it_works: 'A named example with scale.', score: 9, rank: 1, improve: 'Add a verified scheme photograph.',
  };
  const named: Atom = { ...atoms[0], entities: ['Carlisle'], certainty: 'reported' };
  it('rejects provisional or projected main-story atoms but permits labelled secondary context', async () => {
    const catalogue = await loadCatalogue('templates');
    for (const certainty of ['provisional', 'projected'] as const) {
      expect(validateIdeas([base], [{ ...named, certainty }], catalogue).verified).toHaveLength(0);
      expect(validateIdeas([{ ...base, atoms: ['a1', 'a2'] }], [named, { ...named, id: 'a2', certainty }], catalogue).verified).toHaveLength(1);
    }
  });
  it('rejects invented names, missing supported examples and generic hold-backs', async () => {
    const catalogue = await loadCatalogue('templates');
    for (const patch of [{ named_examples: ['Homebase'] }, { named_examples: [] }, { hold_back: 'The records behind the total.' }]) {
      expect(validateIdeas([{ ...base, ...patch }], [named], catalogue).verified).toHaveLength(0);
    }
  });
  it('requires selected evidence for the main story and concrete product hold-back', async () => {
    const catalogue = await loadCatalogue('templates');
    for (const patch of [{ main_atoms: ['missing'] }, { hold_back_atoms: ['missing'] }]) {
      expect(validateIdeas([{ ...base, ...patch }], [named], catalogue).verified).toHaveLength(0);
    }
  });
  it('rejects duplicate ranks, scores and editorial angles', async () => {
    const catalogue = await loadCatalogue('templates');
    for (const patch of [{ rank: 1 }, { score: 9 }, { angle: 'reuse' }]) {
      const second = { ...base, id: 'i2', rank: 2, score: 7, angle: 'another', ...patch };
      expect(validateIdeas([base, second], [named], catalogue).rejected).toHaveLength(1);
    }
  });
  it('requires a meaningful score spread in a batch of four or more', async () => {
    const catalogue = await loadCatalogue('templates');
    const candidates = [9, 8.8, 8.6, 8.4].map((score, i) => ({ ...base, id: `i${i}`, rank: i + 1, angle: `angle${i}`, score }));
    expect(validateIdeas(candidates, [named], catalogue).verified).toHaveLength(0);
    expect(validateIdeas(candidates.map((idea, i) => ({ ...idea, score: 9 - i })), [named], catalogue).verified).toHaveLength(4);
  });
  it('routes multi-region density comparisons to ranked-bars', async () => {
    const catalogue = await loadCatalogue('templates');
    const regions = { ...named, entities: ['London', 'Scotland'], values: [{ value: 151, compare: null, unit: 'courts per 100,000 people', period: null }] };
    const idea = { ...base, named_examples: ['London', 'Scotland'], format: 'comparison', template: 'comparison' };
    expect(validateIdeas([idea], [regions], catalogue).verified).toHaveLength(0);
    expect(validateIdeas([{ ...idea, format: 'ranked-bars', template: 'ranked-bars' }], [regions], catalogue).verified).toHaveLength(1);
  });
});

it('does not mistake a product name for a second region', async () => {
  const catalogue = await loadCatalogue('templates');
  const region: Atom = { ...atoms[0], entities: ['London'], values: [{ value: 151, compare: null, unit: 'courts per 100,000 people', period: null }] };
  const product: Atom = { ...atoms[0], id: 'a2', entities: ['Padel Genie'], kind: 'narrative', values: [] };
  const idea: Idea = { id: 'i1', story: 'London has 151 courts.', atoms: ['a1', 'a2'], main_atoms: ['a1'], hold_back_atoms: ['a2'], named_examples: ['London', 'Padel Genie'], angle: 'local', format: 'stat', template: 'stat-card', hold_back: 'London catchment maps in Padel Genie.', why_it_works: 'A local view.', score: 8, rank: 1, improve: 'Add a named club.' };
  expect(validateIdeas([idea], [region, product], catalogue).verified).toHaveLength(1);
});

it('permits short identifying names but rejects truncated story text', async () => {
  const catalogue = await loadCatalogue('templates');
  const named: Atom = { ...atoms[0], entities: ['Former Homebase, 255 Finchley Road Camden'] };
  const idea: Idea = { id: 'i1', story: 'Homebase on Finchley Road is a named reuse example with 151 applications as context.', atoms: ['a1'], main_atoms: ['a1'], hold_back_atoms: ['a1'], named_examples: ['Homebase'], angle: 'reuse', format: 'stat', template: 'stat-card', hold_back: 'The mapped Homebase application.', why_it_works: 'A named example.', score: 8, rank: 1, improve: 'Add the exact consent date.' };
  expect(validateIdeas([idea], [named], catalogue).verified).toHaveLength(1);
  expect(validateIdeas([{ ...idea, story: 'Homebase on Finchley Road and' }], [named], catalogue).verified).toHaveLength(0);
});
