import { AtomSchema, type Atom } from './schemas/atom.js';

// Parse complete numeric tokens, never substrings. UK thousands separators are
// formatting only; decimal values, signs and magnitudes must be unchanged.
export function numericTokens(text: string): number[] {
  const tokens = text.matchAll(/(?<![\p{L}\p{N}_.,])[-−+]?\d+(?:[,\u00a0\u202f]\d{3})*(?:\.\d+)?(?:st|nd|rd|th)?(?![\p{L}\p{N}_]|[,.]\d)/gu);
  return [...tokens].map(([token]) => Number(token.replace(/[,\u00a0\u202f]/g, '').replace('−', '-').replace(/(?:st|nd|rd|th)$/, '')));
}

export type Rejection = { index: number; id: string | null; reasons: string[]; atom: unknown };
export function verifyAtoms(candidates: readonly unknown[], sourceText: string) {
  const verified: Atom[] = [];
  const rejected: Rejection[] = [];
  const ids = new Set<string>();
  for (const [index, candidate] of candidates.entries()) {
    const parsed = AtomSchema.safeParse(candidate);
    if (!parsed.success) {
      rejected.push({ index, id: null, atom: candidate, reasons: parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`) });
      continue;
    }
    const atom = parsed.data;
    const reasons: string[] = [];
    if (ids.has(atom.id)) reasons.push('duplicate_id');
    ids.add(atom.id);
    if (!atom.source_quote.trim()) reasons.push('empty_quote');
    if (!sourceText.includes(atom.source_quote)) reasons.push('quote_not_in_source');
    const quotedNumbers = numericTokens(atom.source_quote);
    for (const [i, entry] of atom.values.entries()) {
      if (!quotedNumbers.includes(entry.value)) reasons.push(`values.${i}.value_not_in_quote`);
      if (entry.compare !== null && !quotedNumbers.includes(entry.compare)) reasons.push(`values.${i}.compare_not_in_quote`);
      if (numericTokens(entry.unit).some(n => !quotedNumbers.includes(n))) reasons.push(`values.${i}.unit_number_not_in_quote`);
      // Periods often contain years; those must also be present in the quote.
      if (entry.period !== null && numericTokens(entry.period).some(n => !quotedNumbers.includes(n))) {
        reasons.push(`values.${i}.period_number_not_in_quote`);
      }
    }
    // Prevent hiding an unsupported statistic in claim prose while leaving values empty.
    for (const n of numericTokens(atom.claim)) {
      if (!quotedNumbers.includes(n)) reasons.push(`claim_number_not_in_quote:${n}`);
      if (!atom.values.some(v => v.value === n || v.compare === n || (v.period !== null && numericTokens(v.period).includes(n)))) {
        reasons.push(`claim_number_not_declared:${n}`);
      }
    }
    if (reasons.length) rejected.push({ index, id: atom.id, reasons, atom: candidate });
    else verified.push(atom);
  }
  return { verified, rejected, totals: { candidates: candidates.length, verified: verified.length, rejected: rejected.length } };
}
