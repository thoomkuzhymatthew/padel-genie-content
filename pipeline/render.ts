import { chromium } from 'playwright';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { projectRoot } from './env.js';
import { verifyAtoms, numericTokens } from './verify.js';
import { loadCatalogue } from './catalogue.js';
import { sha256, type Source } from './ingest.js';
const DraftSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/), template: z.literal('stat-card'),
  source_bundle: z.string(), atoms: z.array(z.string()).min(1),
  content: z.record(z.string(), z.string()), caption: z.string(),
});
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
export async function renderDraft(filename: string) {
  const draft = DraftSchema.parse(JSON.parse(await readFile(filename, 'utf8')));
  const bundle = resolve(projectRoot, draft.source_bundle);
  const source = JSON.parse(await readFile(join(bundle, 'source.json'), 'utf8')) as Source;
  if (sha256(source.text) !== source.text_sha256) throw new Error('Source hash mismatch');
  const all: unknown[] = JSON.parse(await readFile(join(bundle, 'atoms.verified.json'), 'utf8'));
  const checked = verifyAtoms(all, source.text, { date: source.date });
  if (checked.rejected.length) throw new Error('Source atom handoff failed verification');
  const atoms = checked.verified.filter(atom => draft.atoms.includes(atom.id));
  if (atoms.length !== new Set(draft.atoms).size) throw new Error('Unknown draft atom reference');
  const template = (await loadCatalogue(join(projectRoot, 'templates'))).find(item => item.name === draft.template)!;
  for (const field of template.fields) {
    const value = draft.content[field.name];
    if (field.required && !value?.trim()) throw new Error(`Missing field: ${field.name}`);
    if (value && field.max_characters && [...value].length > field.max_characters) throw new Error(`Field exceeds limit: ${field.name}`);
  }
  if (Object.keys(draft.content).some(key => !template.fields.some(field => field.name === key))) throw new Error('Unknown content field');
  const date = source.date?.slice(0, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Source publication date required');
  const month = new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' });
  if (draft.content.source_line !== `Source: Padel Genie, ${month}`) throw new Error('Source/date line must match publication metadata');
  const allowed = atoms.flatMap(atom => atom.values.flatMap(value => [value.value, ...(value.compare === null ? [] : [value.compare])]));
  for (const [key, value] of Object.entries(draft.content)) {
    if (key !== 'source_line' && numericTokens(value).some(number => !allowed.includes(number))) throw new Error(`Unsupported rendered number: ${key}`);
  }
  if (numericTokens(draft.caption).some(number => !allowed.includes(number))) throw new Error('Unsupported caption number');
  const folder = join(projectRoot, 'templates', draft.template);
  const fonts: Record<string,string> = {};
  for (const name of ['bricolage','inter']) fonts[name + '_font'] = 'data:font/ttf;base64,' + (await readFile(join(projectRoot, 'templates/shared/fonts', name + '.ttf'))).toString('base64');
  let css = await readFile(join(folder, 'style.css'), 'utf8');
  for (const [key, value] of Object.entries(fonts)) css = css.replaceAll('{{' + key + '}}', value);
  const htmlTemplate = await readFile(join(folder, 'template.html'), 'utf8');
  const html = htmlTemplate.replace('{{style}}', css).replace(/{{(\w+)}}/g, (_, key: string) => escapeHtml(draft.content[key] ?? ''));
  const output = join(projectRoot, 'web/public/outputs/style-preview');
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch();
  let checks;
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    checks = await page.evaluate(() => ({
      fonts_ready: document.fonts.check('600 100px Bricolage') && document.fonts.check('400 30px Inter'),
      overflow: [...document.querySelectorAll('h1,.hero,.context,.comparison,.hold-back,.source')].filter(element => {
        const box = element.getBoundingClientRect();
        return box.right > 1080 || box.bottom > 1350 || element.scrollWidth > element.clientWidth + 1;
      }).map(element => element.className || element.tagName),
    }));
    if (!checks.fonts_ready || checks.overflow.length) throw new Error('Render layout/font checks failed: ' + JSON.stringify(checks));
    await page.screenshot({ path: join(output, draft.id + '.png'), type: 'png' });
  } finally { await browser.close(); }
  await writeFile(join(output, draft.id + '.html'), html);
  const trace = { draft_id: draft.id, atoms: draft.atoms, source_sha256: source.text_sha256,
    playbook_sha256: sha256(await readFile(join(projectRoot, 'playbook/playbook.md'), 'utf8')),
    template_sha256: sha256(htmlTemplate + css), content_sha256: sha256(JSON.stringify(draft.content)),
    size: { width: 1080, height: 1350 }, checks, status: 'awaiting_style_approval' };
  await writeFile(join(output, draft.id + '.trace.json'), JSON.stringify(trace, null, 2) + '\n');
  console.log('Rendered: ' + join(output, draft.id + '.png'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { draft: { type: 'string' } }, strict: true });
    if (!values.draft) throw new Error('Usage: npm run render -- --draft <draft.json>');
    await renderDraft(resolve(values.draft));
  } catch (error) { console.error(error instanceof Error ? error.message : 'Render failed'); process.exitCode = 1; }
}
