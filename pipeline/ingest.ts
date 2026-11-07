import { load } from 'cheerio';
import { parse } from 'csv-parse/sync';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import settings from '../config/pipeline.json';

export type Source = {
  title: string; url: string | null; date: string | null; input: string;
  format: 'html' | 'markdown' | 'csv'; text: string;
  tables: string[][][]; figures: { caption: string; alt: string }[];
  retrieved_at: string; raw_sha256: string; text_sha256: string;
};
export const sha256 = (text: string) => createHash('sha256').update(text).digest('hex');
const clean = (text: string) => text.replace(/\r\n?/g, '\n').replace(/[\t \u00a0\u202f]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();

export function parseSource(raw: string, input: string, format: Source['format']): Source {
  let title = basename(input), date: string | null = null, text = '';
  const tables: string[][][] = [], figures: Source['figures'] = [];
  if (format === 'html') {
    const $ = load(raw);
    title = clean($('meta[property="og:title"]').attr('content') || $('h1').first().text() || $('title').text() || title);
    date = $('meta[property="article:published_time"]').attr('content') || $('time[datetime]').first().attr('datetime') || null;
    if (!date) {
      for (const element of $('script[type="application/ld+json"]').toArray()) {
        try {
          const findDate = (value: unknown): string | null => {
            if (!value || typeof value !== 'object') return null;
            const object = value as Record<string, unknown>;
            if (typeof object.datePublished === 'string') return object.datePublished;
            for (const item of Object.values(object)) { const found = findDate(item); if (found) return found; }
            return null;
          };
          date = findDate(JSON.parse($(element).text()));
          if (date) break;
        } catch { /* Invalid metadata must not discard article text. */ }
      }
    }
    $('script, style, noscript, nav, footer, form, aside, [hidden], [aria-hidden="true"]').remove();
    const root = $('article').first().length ? $('article').first() : $('main').first().length ? $('main').first() : $('body');
    root.find('table').each((_, table) => {
      const rows: string[][] = [];
      $(table).find('tr').each((_, row) => { rows.push($(row).find('th,td').toArray().map(cell => clean($(cell).text()))); });
      tables.push(rows);
    });
    root.find('figure').each((_, figure) => {
      figures.push({ caption: clean($(figure).find('figcaption').text()), alt: $(figure).find('img').first().attr('alt') || '' });
    });
    // Insert stable block/cell separators before extracting text, preserving inline words.
    root.find('br').replaceWith('\n');
    root.find('span,strong,b,em,i,a,small,sup,sub').before(' ').after(' ');
    root.find('th,td').append(' | ');
    root.find('p,h1,h2,h3,h4,h5,h6,li,tr,section,div,blockquote,figcaption,table').append('\n');
    text = clean(root.text());
    if (!date) {
      const match = text.match(/(?:^|\n)[^\n]*·\s*(\d{1,2}) (January|February|March|April|May|June|July|August|September|October|November|December) (\d{4})\s*·/);
      if (match) {
        const month = ['January','February','March','April','May','June','July','August','September','October','November','December'].indexOf(match[2]) + 1;
        date = `${match[3]}-${String(month).padStart(2, '0')}-${match[1].padStart(2, '0')}`;
      }
    }
  } else if (format === 'csv') {
    const rows = parse(raw, { bom: true, skip_empty_lines: true, relax_column_count: false }) as string[][];
    if (!rows.length) throw new Error('CSV source is empty');
    tables.push(rows);
    // JSON-escaped cells retain embedded delimiters/newlines without changing evidence boundaries.
    text = rows.map(row => row.map(cell => JSON.stringify(cell)).join(' | ')).join('\n');
  } else {
    text = raw.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
    title = text.match(/^#\s+(.+)$/m)?.[1] || title;
  }
  if (!text.trim()) throw new Error('Source contains no readable text');
  if (text.length > settings.maxSourceCharacters) throw new Error('Source exceeds configured character limit; split the file explicitly');
  return {
    title, url: /^https?:\/\//i.test(input) ? input : null, date, input, format, text, tables, figures,
    retrieved_at: new Date().toISOString(), raw_sha256: sha256(raw), text_sha256: sha256(text),
  };
}

export async function ingest(input: string): Promise<{ source: Source; raw: string }> {
  let raw: string, format: Source['format'];
  if (/^https?:\/\//i.test(input)) {
    const response = await fetch(input, { headers: { 'User-Agent': settings.userAgent }, signal: AbortSignal.timeout(settings.requestTimeoutMs) });
    if (!response.ok) throw new Error(`Source request failed: HTTP ${response.status}`);
    const type = response.headers.get('content-type') || '';
    if (!/text\/(html|plain|markdown|csv)|application\/csv/i.test(type)) throw new Error(`Unsupported source content type: ${type}`);
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Source response has no body');
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > settings.maxSourceBytes) throw new Error('Source exceeds configured byte limit');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    raw = Buffer.concat(chunks).toString('utf8');
    format = /html/i.test(type) ? 'html' : /csv/i.test(type) ? 'csv' : 'markdown';
  } else {
    const bytes = await readFile(input);
    if (bytes.length > settings.maxSourceBytes) throw new Error('Source exceeds configured byte limit');
    raw = bytes.toString('utf8');
    const extension = extname(input).toLowerCase();
    if (!['.html', '.htm', '.md', '.markdown', '.txt', '.csv'].includes(extension)) throw new Error('Use HTML, Markdown, text or CSV input');
    format = ['.html', '.htm'].includes(extension) ? 'html' : extension === '.csv' ? 'csv' : 'markdown';
  }
  return { source: parseSource(raw, input, format), raw };
}
