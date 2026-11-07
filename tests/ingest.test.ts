import { describe, expect, it, vi, afterEach } from 'vitest';
import { ingest, parseSource, sha256 } from '../pipeline/ingest.js';
import { verifyAtoms } from '../pipeline/verify.js';

afterEach(() => vi.unstubAllGlobals());
describe('HTML, Markdown and CSV ingestion', () => {
  it('isolates article content, decodes entities and preserves table/figure evidence', () => {
    const raw = `<html><head><meta property="article:published_time" content="2026-10-01" /></head><body>
      <nav>999 menus</nav><article><h1>Court report</h1><p>There are <strong>3,000</strong> courts &amp; counting.</p>
      <table><tr><th>Place</th><th>Courts</th></tr><tr><td>London</td><td>151</td></tr></table>
      <figure><img alt="Court chart" /><figcaption>Growth: 12.5%.</figcaption></figure>
      <script>99999</script></article><footer>888 footers</footer></body></html>`;
    const result = parseSource(raw, 'https://example.com/report', 'html');
    expect(result.title).toBe('Court report');
    expect(result.date).toBe('2026-10-01');
    expect(result.text).toContain('There are 3,000 courts & counting.');
    expect(result.text).not.toMatch(/999|888/);
    expect(result.tables).toEqual([[['Place', 'Courts'], ['London', '151']]]);
    expect(result.figures).toEqual([{ caption: 'Growth: 12.5%.', alt: 'Court chart' }]);
    expect(result.raw_sha256).toBe(sha256(raw));
    expect(result.text_sha256).toBe(sha256(result.text));
  });
  it('extracts publication date from JSON-LD', () => {
    const source = parseSource('<script type="application/ld+json">{"@graph":[{"datePublished":"2026-08-31"}]}</script><main><h1>August</h1><p>151 applications.</p></main>', 'report.html', 'html');
    expect(source.date).toBe('2026-08-31');
  });
  it('retains Markdown evidence and normalises line endings once', () => {
    const source = parseSource('# August report\r\n\r\n151 applications, up from 50.', 'august.md', 'markdown');
    expect(source.title).toBe('August report');
    expect(source.text).toBe('# August report\n\n151 applications, up from 50.');
    expect(source.url).toBeNull();
    expect(source.date).toBeNull();
  });
  it('preserves CSV headers and quoted numeric values as contiguous evidence', () => {
    const source = parseSource('Place,Courts\r\nLondon,"3,000"\r\nBristol,151', 'courts.csv', 'csv');
    expect(source.tables[0]).toEqual([['Place', 'Courts'], ['London', '3,000'], ['Bristol', '151']]);
    expect(verifyAtoms([{
      id: 'a1', claim: 'London has 3,000 courts.',
      values: [{ value: 3000, unit: 'courts', compare: null, period: null }],
      place: 'London', source_quote: '"Place" | "Courts"\n"London" | "3,000"',
    }], source.text).verified).toHaveLength(1);
  });
  it('preserves CSV fields containing embedded commas and newlines', () => {
    const source = parseSource('Place,Notes\nLondon,"First line\nsecond, line"', 'notes.csv', 'csv');
    expect(source.tables[0][1][1]).toBe('First line\nsecond, line');
  });
  it('rejects inconsistent CSV columns', () => {
    expect(() => parseSource('Place,Courts\nLondon,151,extra', 'bad.csv', 'csv')).toThrow();
  });
  it('rejects empty and oversized text', () => {
    expect(() => parseSource('<body><script>nothing</script></body>', 'empty.html', 'html')).toThrow('no readable text');
    expect(() => parseSource('x'.repeat(180001), 'large.md', 'markdown')).toThrow('character limit');
  });
  it('fetches a URL once with a clear user agent', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('<article><h1>Report</h1><p>151 courts.</p></article>', { headers: { 'Content-Type': 'text/html' } }));
    vi.stubGlobal('fetch', fetcher);
    const result = await ingest('https://example.com/report');
    expect(result.source.text).toContain('151 courts.');
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher.mock.calls[0][1].headers['User-Agent']).toContain('PadelGenieContentTrial');
  });
  it('rejects HTTP errors and unsupported response types', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('missing', { status: 404 })));
    await expect(ingest('https://example.com/report')).rejects.toThrow('HTTP 404');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('binary', { headers: { 'Content-Type': 'image/png' } })));
    await expect(ingest('https://example.com/image')).rejects.toThrow('Unsupported source content type');
  });
});

it('separates adjacent inline statistic labels and reads a visible publication date', () => {
  const result = parseSource('<article><p>James · 31 August 2026 · 8 minute read</p><div><strong>945</strong><span>Courts approved</span><small>From 456</small></div></article>', 'report.html', 'html');
  expect(result.text).toContain('945 Courts approved From 456');
  expect(result.date).toBe('2026-08-31');
});

it('does not mistake a date mentioned in the body for a publication date', () => {
  expect(parseSource('<article><h1>Report</h1><p>The court opened on 1 August 2025.</p></article>', 'report.html', 'html').date).toBeNull();
});
