import { chromium } from 'playwright';
import {checkLayout,assertLayout} from './layout.js';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { projectRoot } from './env.js';
import { verifyAtoms, numericTokens } from './verify.js';
import { loadCatalogue, type Template } from './catalogue.js';
import { sha256, type Source } from './ingest.js';
import type { Atom } from './schemas/atom.js';
import { fieldValues, fillTemplate, type JsonRecord } from './template.js';
export const DraftSchema = z.strictObject({
  id: z.string().regex(/^[a-z0-9-]+$/), template: z.string().regex(/^[a-z0-9-]+$/),
  source_bundle: z.string(), atoms: z.array(z.string()).min(1),
  content: z.record(z.string(), z.unknown()), caption: z.string(),
});
export function validateFields(content: JsonRecord, template: Template) {
  for (const field of template.fields) {
    const values = fieldValues(content, field.name);
    for (const value of values) {
      if (value === undefined || value === null) { if (field.required) throw new Error(`Missing field: ${field.name}`); continue; }
      if (field.type === 'string') {
        if (typeof value !== 'string' || (field.required && !value.trim())) throw new Error(`Invalid field: ${field.name}`);
        if (field.max_characters && [...value].length > field.max_characters) throw new Error(`Field exceeds limit: ${field.name}`);
      } else if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw new Error(`Invalid numeric field: ${field.name}`);
      else if (field.type === 'array') {
        if (!Array.isArray(value)) throw new Error(`Invalid array field: ${field.name}`);
        if (field.min_items !== null && value.length < field.min_items || field.max_items !== null && value.length > field.max_items) throw new Error(`Array exceeds limits: ${field.name}`);
      }
    }
  }
  const known = new Set(template.fields.map(field => field.name.split('.')[0].replace('[]', '')));
  if (Object.keys(content).some(key => !known.has(key))) throw new Error('Unknown content field');
}
const strings = (value: unknown): (string | number)[] => Array.isArray(value) ? value.flatMap(strings) : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : typeof value === 'string' || typeof value === 'number' ? [value] : [];
const patternEscape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
export function checkGraphicEvidence(template: string, content: JsonRecord, atoms: Atom[]) {
  const byId = new Map(atoms.map(atom => [atom.id, atom]));
  if (template === 'ranked-bars') {
    const items = content.items as { label: string; value: number; atom_id: string }[];
    for (const item of items) {
      const atom = byId.get(item.atom_id);
      const literal = atom?.source_quote.match(new RegExp(patternEscape(item.label) + '\\s+([-+]?\\d+(?:\\.\\d+)?)(?![\\d.])'))?.[1];
      if (!literal || Number(literal) !== item.value) throw new Error(`Region/value evidence mismatch: ${item.label}`);
    }
    const average = atoms.map(atom => atom.source_quote.match(/GB average (\d+(?:\.\d+)?)/)?.[1]).find(value => value !== undefined);
    if (average === undefined || Number(average) !== content.average) throw new Error('GB average evidence mismatch');
    if (new Set(items.map(item => item.label)).size !== items.length) throw new Error('Duplicate ranked label');
    if (items.some((item, i) => i > 0 && item.value > items[i - 1].value)) throw new Error('Ranked values must descend');
    const published = atoms.flatMap(atom => [...atom.source_quote.matchAll(/(?:^| )([A-Z][A-Za-z ]+?) (\d+\.\d{2})(?= |$)/g)].map(match => match[1].trim()));
    for (const label of new Set(published.filter(label => !label.includes('average')))) {
      if (!items.some(item => item.label === label)) throw new Error(`Published region missing: ${label}`);
    }
  }
  if (template === 'comparison') {
    const pair = (atomId: string, before: number, after: number, label: string) => {
      const normalized = (text: string) => text.toLowerCase().replace(/[^a-z]/g, '');
      if (!byId.get(atomId)?.values.some(value => value.value === after && value.compare === before && normalized(value.unit) === normalized(label))) throw new Error('Comparison pair evidence mismatch');
    };
    pair(content.comparison_atom_id as string, Number((content.left as JsonRecord).hero), Number((content.right as JsonRecord).hero), String((content.left as JsonRecord).context));
    for (const row of content.rows as { label: string; before: number; after: number; atom_id: string }[]) pair(row.atom_id, row.before, row.after, row.label);
    const beforeYear = String((content.left as JsonRecord).label).match(/\b\d{4}\b/)?.[0];
    const afterYear = String((content.right as JsonRecord).label).match(/\b\d{4}\b/)?.[0];
    if (beforeYear && afterYear && Number(beforeYear) >= Number(afterYear)) throw new Error('Comparison years must run forwards');
    if (atoms.some(atom => atom.certainty === 'provisional') && !/provisional/i.test(String(content.context))) throw new Error('Comparison must retain provisional caveat');
  }
}
export async function renderDraft(filename: string, options: { outputSubdir?: string } = {}) {
  const draft = DraftSchema.parse(JSON.parse(await readFile(filename, 'utf8')));
  const bundle = resolve(projectRoot, draft.source_bundle);
  const source = JSON.parse(await readFile(join(bundle, 'source.json'), 'utf8')) as Source;
  if (sha256(source.text) !== source.text_sha256) throw new Error('Source hash mismatch');
  const all: unknown[] = JSON.parse(await readFile(join(bundle, 'atoms.verified.json'), 'utf8'));
  const checked = verifyAtoms(all, source.text, { date: source.date });
  if (checked.rejected.length) throw new Error('Source atom handoff failed verification');
  const atoms = checked.verified.filter(atom => draft.atoms.includes(atom.id));
  if (atoms.length !== new Set(draft.atoms).size) throw new Error('Unknown draft atom reference');
  const template = (await loadCatalogue(join(projectRoot, 'templates'))).find(item => item.name === draft.template);
  if (!template) throw new Error('Unknown template');
  validateFields(draft.content, template);
  const date = source.date?.slice(0, 10);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Source publication date required');
  const month = new Date(date + 'T12:00:00Z').toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Europe/London' });
  if (draft.content.source_line !== `Source: Padel Genie, ${month}`) throw new Error('Source/date line must match publication metadata');
  const allowed = atoms.flatMap(atom => atom.values.flatMap(value => [value.value, ...(value.compare === null ? [] : [value.compare]), ...numericTokens(value.period ?? '')]));
  for (const [key, value] of Object.entries(draft.content)) {
    if (key !== 'source_line' && strings(value).some(text => numericTokens(String(text)).some(number => !allowed.includes(number)))) throw new Error(`Unsupported rendered number: ${key}`);
  }
  if (numericTokens(draft.caption).some(number => !allowed.includes(number))) throw new Error('Unsupported caption number');
  checkGraphicEvidence(draft.template, draft.content, atoms);
  const folder = join(projectRoot, 'templates', draft.template);
  let css = await readFile(join(folder, 'style.css'), 'utf8');
  const sharedCss = await readFile(join(projectRoot, 'templates/shared/frame.css'), 'utf8');
  css = sharedCss + '\n' + css;
  for (const name of ['bricolage', 'inter']) css = css.replaceAll('{{' + name + '_font}}', 'data:font/ttf;base64,' + (await readFile(join(projectRoot, 'templates/shared/fonts', name + '.ttf'))).toString('base64'));
  const htmlTemplate = await readFile(join(folder, 'template.html'), 'utf8');
  let views: JsonRecord[] = [draft.content];
  if (draft.template === 'ranked-bars') {
    const items = draft.content.items as { label: string; value: number; atom_id: string }[];
    const maximum = Math.max(...items.map(item => item.value)) * 1.08;
    views = [{ ...draft.content, items: items.map(item => ({ ...item, width: item.value / maximum * 100, formatted: item.value.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 20 }) })), average_position: Number(draft.content.average) / maximum * 100 }];
  } else if (draft.template === 'comparison') {
    views = [{ ...draft.content, rows: (draft.content.rows as JsonRecord[]).map(row => ({ ...row,
      before_display: Number(row.before).toLocaleString('en-GB', { maximumFractionDigits: 20 }), after_display: Number(row.after).toLocaleString('en-GB', { maximumFractionDigits: 20 }),
    })) }];
  } else if (draft.template === 'carousel-basic') {
    const content = draft.content;
    views = [
      { ...content, headline: content.hook, hero: content.hook_hero, body: content.hook_body, kind: 'hook', note: content.hook_note },
      ...(content.content_slides as JsonRecord[]).map(slide => ({ ...content, ...slide, kind: 'content' })),
      { ...content, headline: content.closing_headline, hero: content.closing_hero, body: content.closing_body, note: content.hold_back, kind: 'closing' },
    ].map((view, index, all) => ({ ...view, page_label: `${String(index + 1).padStart(2, '0')} / ${String(all.length).padStart(2, '0')}` }));
  }
  if (views.length < template.slides.min || views.length > template.slides.max) throw new Error('Slide count outside template limits');
  const outputSubdir = options.outputSubdir || 'milestone-4';
  if (!/^[a-z0-9/-]+$/.test(outputSubdir) || outputSubdir.includes('..')) throw new Error('Invalid output directory');
  const output = join(projectRoot, 'web/public/outputs', outputSubdir);
  await mkdir(output, { recursive: true });
  const browser = await chromium.launch();
  const assets: string[] = [], pageChecks: unknown[] = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    for (const [index, view] of views.entries()) {
      const html = fillTemplate(htmlTemplate.replace('{{style}}', css), view);
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const checks = await checkLayout(page);
      assertLayout(checks);
      const basename = draft.id + (views.length > 1 ? '-' + String(index + 1).padStart(2, '0') : '');
      await page.screenshot({ path: join(output, basename + '.png'), type: 'png' });
      await writeFile(join(output, basename + '.html'), html);
      assets.push('/outputs/' + outputSubdir + '/' + basename + '.png'); pageChecks.push(checks);
    }
  } finally { await browser.close(); }
  let copyGeneration: unknown = null;
  try { copyGeneration = JSON.parse(await readFile(filename + '.copy-trace.json', 'utf8')); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
  const trace = { draft_id: draft.id, format: template.format, atoms: draft.atoms, source_url: source.url, source_sha256: source.text_sha256,
    playbook_sha256: sha256(await readFile(join(projectRoot, 'playbook/playbook.md'), 'utf8')),
    template_sha256: sha256(htmlTemplate + css), content_sha256: sha256(JSON.stringify(draft.content)),
    size: { width: 1080, height: 1350 }, checks: pageChecks, assets, caption: draft.caption,
    content_origin: copyGeneration ? 'configured_copy_model' : 'assistant_editorial_draft', copy_generation: copyGeneration,
    renderer_sha256: sha256(await readFile(new URL('./render.ts', import.meta.url), 'utf8')), style_approved: true, status: 'rendered_for_review' };
  await writeFile(join(output, draft.id + '.trace.json'), JSON.stringify(trace, null, 2) + '\n');
  console.log('Rendered ' + assets.length + ' image(s): ' + draft.id);
  return trace;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { values } = parseArgs({ options: { draft: { type: 'string' }, post: { type: 'string' } }, strict: true });
    if (values.post && !values.draft) {
      const { renderQueuedPost } = await import('./render-post.js');
      await renderQueuedPost(values.post, renderDraft);
    } else if (values.draft && !values.post) await renderDraft(resolve(values.draft));
    else throw new Error('Usage: npm run render -- --draft <draft.json> OR --post <id>');
  } catch (error) { console.error(error instanceof Error ? error.message : 'Render failed'); process.exitCode = 1; }
}
