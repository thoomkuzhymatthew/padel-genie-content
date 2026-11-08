import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { projectRoot } from './env.js';
import { loadCatalogue } from './catalogue.js';
import { verifyAtoms } from './verify.js';
import { sha256, type Source } from './ingest.js';

export async function assemblePrompt(source: Source, candidates: readonly unknown[], root = projectRoot, stage: 'ideate' | 'write' = 'ideate', playbookOverride?: string) {
  if (sha256(source.text) !== source.text_sha256) throw new Error('Source text hash mismatch');
  const checked = verifyAtoms(candidates, source.text, { date: source.date });
  if (checked.rejected.length || !checked.verified.length) throw new Error('Prompt requires a non-empty, fully verified atom handoff');
  const playbook = playbookOverride ?? await readFile(join(root, 'playbook/playbook.md'), 'utf8');
  const learnings = await readFile(join(root, 'playbook/learnings.md'), 'utf8');
  const catalogue = await loadCatalogue(join(root, 'templates'));
  const playbookVersion = playbook.match(/^# Padel Genie social intern — playbook (v\d+)\s*$/m)?.[1];
  if (!playbookVersion || !playbook.includes('<!-- LOCKED: the learning loop must never edit anything below this line -->')) throw new Error('Playbook version or locked rules marker missing');
  const system = [
    playbook,
    '# Available template catalogue\n' + JSON.stringify(catalogue, null, 2),
    '# Latest merged learnings\n' + learnings,
    '# Stage instructions\n' + await readFile(join(root, `pipeline/prompts/${stage}.md`), 'utf8'),
  ].join('\n\n');
  // Full source is retained in the run, but only verified facts enter ideation.
  const input = JSON.stringify({ source: { title: source.title, url: source.url, date: source.date }, verified_atoms: checked.verified });
  return { system, input, catalogue, atoms: checked.verified, provenance: {
    playbook_version: playbookVersion, playbook_sha256: sha256(playbook),
    learnings_sha256: sha256(learnings), catalogue_sha256: sha256(JSON.stringify(catalogue)),
    atoms_sha256: sha256(JSON.stringify(checked.verified)), source_sha256: source.text_sha256,
    system_prompt_sha256: sha256(system), input_sha256: sha256(input),
  } };
}
