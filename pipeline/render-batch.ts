import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseArgs } from 'node:util';
import { projectRoot } from './env.js';
import { renderDraft } from './render.js';
const { values } = parseArgs({ options: { reserve: { type: 'boolean' } }, strict: true });
const manifest = JSON.parse(await readFile(join(projectRoot, 'config/demo-posts.json'), 'utf8')) as { selected: string[]; reserve: string };
for (const file of [...manifest.selected, ...(values.reserve ? [manifest.reserve] : [])]) await renderDraft(join(projectRoot, file));
