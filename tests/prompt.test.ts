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
  const idea: Idea = { id: 'i1', story: '151 applications show the scale of the pipeline.', atoms: ['a1'], format: 'stat', template: 'stat-card', hold_back: 'Explore the planning records in Padel Genie.', why_it_works: 'A concrete view of the pipeline.', score: 8.5 };
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
  it('keeps the section 7 playbook and locked rules intact', async () => {
    const brief = await readFile('agents.md', 'utf8');
    const expected = brief.match(/### First draft of `playbook\/playbook.md`\n\n```markdown\n([\s\S]*?)\n```/)?.[1];
    expect((await readFile('playbook/playbook.md', 'utf8')).trim()).toBe(expected);
  });
});

it('permits quoted period numerals while still restricting them to selected atoms', async () => {
  const catalogue = await loadCatalogue('templates');
  const dated = { ...atoms[0], values: [{ ...atoms[0].values[0], period: 'last 12 months' }] };
  const idea: Idea = { id: 'i1', story: '151 applications in the last 12 months.', atoms: ['a1'], format: 'stat', template: 'stat-card', hold_back: 'Explore the planning records.', why_it_works: 'Clear scope.', score: 8 };
  expect(validateIdeas([idea], [dated], catalogue).verified).toHaveLength(1);
  expect(validateIdeas([idea], atoms, catalogue).verified).toHaveLength(0);
});
