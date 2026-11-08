import { describe, expect, it } from 'vitest';
import { numericTokens, verifyAtoms } from '../pipeline/verify.js';
import type { Atom } from '../pipeline/schemas/atom.js';
const quote = 'Applications rose to 151 from 50 in the 12 months to August 2026.';
const atom = (patch: Partial<Atom> = {}): Atom => ({
  id: 'a1', claim: 'Applications rose to 151 from 50.',
  values: [{ value: 151, compare: 50, unit: 'applications', period: '12 months to August 2026' }],
  place: 'UK', source_quote: quote, ...patch,
});
const verify = (item: unknown, source = quote) => verifyAtoms([item], source);

describe('verifier evidence gate', () => {
  it('accepts verbatim quotes and supported values, comparisons and periods', () => {
    expect(verify(atom()).totals).toEqual({ candidates: 1, verified: 1, rejected: 0 });
  });
  it('rejects a fabricated quote even if its numbers match the article', () => {
    expect(verify(atom({ source_quote: '151 applications, previously 50 in 2026.' })).rejected[0].reasons).toContain('quote_not_in_source');
  });
  it('rejects case, punctuation and interior whitespace changes', () => {
    for (const changed of [quote.toLowerCase(), quote.replace('.', '!'), quote.replace('rose to', 'rose  to')]) {
      expect(verify(atom({ source_quote: changed })).rejected[0].reasons).toContain('quote_not_in_source');
    }
  });
  it('requires the comparison in the quote, not just elsewhere in the source', () => {
    const item = atom({ source_quote: 'There were 151 applications.', values: [{ value: 151, compare: 50, unit: 'applications', period: null }] });
    expect(verify(item, 'There were 151 applications. Last year there were 50.').rejected[0].reasons).toContain('values.0.compare_not_in_quote');
  });
  it('rejects 15 as evidence from 151, and 51 as evidence from 151', () => {
    for (const n of [15, 51]) {
      expect(verify(atom({ values: [{ value: n, compare: null, unit: 'applications', period: null }] })).rejected[0].reasons).toContain('values.0.value_not_in_quote');
    }
  });
  it.each([
    ['There are 3,000 courts.', 3000], ['Growth is 12.5%.', 12.5],
    ['The change was -2.5%.', -2.5], ['The change was −2.5%.', -2.5],
    ['There are 3\u202f000 courts.', 3000], ['There are 3\u00a0000 courts.', 3000],
    ['There are 0 courts.', 0], ['The price is £50.', 50],
  ])('accepts unchanged numeric magnitude in %s', (source, value) => {
    expect(verify(atom({ claim: 'A supported figure.', source_quote: source, values: [{ value, compare: null, unit: 'units', period: null }] }), source).verified).toHaveLength(1);
  });
  it.each([
    ['Growth is 12.5%.', 12], ['Growth is 12.5%.', 5],
    ['Change is -5.', 5], ['There are 3k courts.', 3000],
    ['There are 0.5 million courts.', 500000], ['There are 3,000 courts.', 3],
  ])('rejects numeric fragments or implicit conversions in %s', (source, value) => {
    expect(verify(atom({ claim: 'A figure.', source_quote: source, values: [{ value, compare: null, unit: 'units', period: null }] }), source).verified).toHaveLength(0);
  });
  it('rejects invented period years', () => {
    expect(verify(atom({ values: [{ value: 151, compare: 50, unit: 'applications', period: '2025' }] })).rejected[0].reasons).toContain('values.0.period_number_not_in_quote');
  });
  it('rejects hidden claim numbers even when values is empty', () => {
    expect(verify(atom({ claim: '999 courts opened.', values: [] })).rejected[0].reasons).toContain('claim_number_not_in_quote:999');
    expect(verify(atom({ claim: '151 applications.', values: [] })).rejected[0].reasons).toContain('claim_number_not_declared:151');
  });
  it('rejects duplicate IDs so references remain unambiguous', () => {
    const result = verifyAtoms([atom(), atom()], quote);
    expect(result.verified).toHaveLength(1);
    expect(result.rejected[0].reasons).toContain('duplicate_id');
  });
  it.each([null, {}, { id: 'x' }, atom({ source_quote: '' }), atom({ values: [{ value: NaN, compare: null, unit: 'courts', period: null }] })])('rejects malformed atoms', item => {
    expect(verify(item).verified).toHaveLength(0);
  });
  it('permits non-numeric facts with exact evidence', () => {
    const source = 'Padel is moving into empty warehouses.';
    expect(verify(atom({ claim: source, source_quote: source, values: [] }), source).verified).toHaveLength(1);
  });
  it('partitions accepted and rejected candidates without losing rejection evidence', () => {
    const bad = atom({ id: 'bad', source_quote: 'Invented.' });
    const result = verifyAtoms([atom(), bad], quote);
    expect(result.verified.map(a => a.id)).toEqual(['a1']);
    expect(result.rejected[0].atom).toEqual(bad);
    expect(result.totals).toEqual({ candidates: 2, verified: 1, rejected: 1 });
  });
  it('returns empty handoff for empty input', () => {
    expect(verifyAtoms([], '').verified).toEqual([]);
  });
});

describe('numeric token boundaries', () => {
  it('does not extract pieces from IDs or decimals', () => {
    expect(numericTokens('a151 id_50 v1.5 151 12.5%')).toEqual([151, 12.5]);
  });
});

it('does not trim evidence to turn an invalid quote into a match', () => {
  expect(verify(atom({ source_quote: ` ${quote} ` })).rejected[0].reasons).toContain('quote_not_in_source');
});
it('rejects whitespace-only evidence', () => {
  expect(verify(atom({ source_quote: ' ', values: [], claim: 'A fact.' })).rejected[0].reasons).toContain('empty_quote');
});

it('checks ordinal dates in periods and claims', () => {
  const source = 'Open between 24th September and 23rd October 2026: 593 clubs.';
  const item = atom({ claim: '593 clubs between 24th September and 23rd October 2026.', source_quote: source, values: [{ value: 593, compare: null, unit: 'clubs', period: '24th September and 23rd October 2026' }] });
  expect(verify(item, source).verified).toHaveLength(1);
  expect(verify({ ...item, claim: '593 clubs on the 25th.' }, source).verified).toHaveLength(0);
});
it('checks numeric denominators inside units', () => {
  const source = 'There are 26 courts.';
  const item = atom({ claim: '26 courts.', source_quote: source, values: [{ value: 26, compare: null, unit: 'courts per 100,000 people', period: null }] });
  expect(verify(item, source).rejected[0].reasons).toContain('values.0.unit_number_not_in_quote');
});
it('does not accept fragments of malformed grouped numbers', () => {
  expect(numericTokens('1,23 or 1.2.3')).toEqual([]);
});

describe('publication metadata periods', () => {
  const source = 'The UK now has 3,061 padel courts open across 891 clubs.';
  const headline = atom({ claim: source, source_quote: source, values: [
    { value: 3061, compare: null, unit: 'courts', period: '2026-10-25', period_source: 'metadata' },
    { value: 891, compare: null, unit: 'clubs', period: '2026-10-25', period_source: 'metadata' },
  ] });
  it('accepts a metadata period absent from the quote', () => {
    expect(verifyAtoms([headline], source, { date: '2026-10-25' }).verified).toHaveLength(1);
  });
  it('rejects missing metadata, invented dates and inferred reporting ranges', () => {
    expect(verifyAtoms([headline], source).verified).toHaveLength(0);
    for (const period of ['2025-10-25', '12 months to October 2026', null]) {
      expect(verifyAtoms([{ ...headline, values: [{ ...headline.values[0], period }] }], source, { date: '2026-10-25' }).verified).toHaveLength(0);
    }
  });
  it('never uses metadata to verify statistics or comparisons', () => {
    for (const patch of [{ value: 2026 }, { compare: 25 }]) {
      expect(verifyAtoms([{ ...headline, values: [{ ...headline.values[0], ...patch }] }], source, { date: '2026-10-25' }).verified).toHaveLength(0);
    }
  });
  it('does not allow metadata dates to bypass numeric claim verification', () => {
    expect(verifyAtoms([{ ...headline, claim: '2026 courts opened.' }], source, { date: '2026-10-25' }).verified).toHaveLength(0);
  });
  it('keeps quote-based periods subject to quote verification', () => {
    expect(verifyAtoms([{ ...headline, values: [{ ...headline.values[0], period_source: 'quote' }] }], source, { date: '2026-10-25' }).verified).toHaveLength(0);
  });
});

describe('named narrative atoms', () => {
  const source = 'The former Homebase on Finchley Road was granted temporary consent for covered courts.';
  const narrative = atom({ kind: 'narrative', entities: ['Homebase', 'Finchley Road'], certainty: 'reported', claim: 'The former Homebase on Finchley Road has temporary consent for covered courts.', source_quote: source, values: [] });
  it('accepts named factual claims without numbers', () => {
    expect(verify(narrative, source).verified).toHaveLength(1);
  });
  it('rejects invented entity names and invented narrative quotes', () => {
    expect(verify({ ...narrative, entities: ['Carlisle'] }, source).rejected[0].reasons).toContain('entity_not_in_quote:Carlisle');
    expect(verify({ ...narrative, source_quote: 'Homebase became a hotel.' }, source).verified).toHaveLength(0);
  });
  it('requires numbers in narrative claims to be declared and quote-verified', () => {
    const quote = 'July applications were revised from 63 to 93.';
    const revision = { ...narrative, entities: ['July'], claim: quote, source_quote: quote, values: [{ value: 93, compare: 63, unit: 'applications', period: 'July', period_source: 'quote' }] };
    expect(verify(revision, quote).verified).toHaveLength(1);
    expect(verify({ ...revision, values: [] }, quote).verified).toHaveLength(0);
    expect(verify({ ...revision, values: [{ ...revision.values[0], compare: 62 }] }, quote).verified).toHaveLength(0);
  });
});

it('keeps named business descriptions neutral even when the source uses a negative adjective', () => {
  const source = 'A dead Homebase on Finchley Road has temporary consent.';
  const narrative = atom({ kind: 'narrative', entities: ['Homebase', 'Finchley Road'], values: [], source_quote: source, claim: source });
  expect(verify(narrative, source).rejected[0].reasons).toContain('negative_named_entity_claim');
  expect(verify({ ...narrative, claim: 'A former Homebase on Finchley Road has temporary consent.' }, source).verified).toHaveLength(1);
});

it('checks number words in narratives without converting them to numeric evidence', () => {
  const source = 'Two clubs led revenue: Carbon Padel Club and Rocks Lane Chiswick.';
  const narrative = atom({ kind: 'narrative', entities: ['Carbon Padel Club', 'Rocks Lane Chiswick'], values: [], source_quote: source, claim: 'Two clubs led revenue: Carbon Padel Club and Rocks Lane Chiswick.' });
  expect(verify(narrative, source).verified).toHaveLength(1);
  expect(verify({ ...narrative, claim: 'Three clubs led revenue.' }, source).rejected[0].reasons).toContain('narrative_number_word_not_in_quote:three');
  expect(verify({ ...narrative, values: [{ value: 2, compare: null, unit: 'clubs', period: null }] }, source).verified).toHaveLength(0);
});
