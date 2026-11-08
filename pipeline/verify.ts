import { AtomSchema, type Atom } from './schemas/atom.js';

// Parse complete numeric tokens, never substrings. UK thousands separators are
// formatting only; decimal values, signs and magnitudes must be unchanged.
export function numericTokens(text: string): number[] {
  const tokens = text.matchAll(/(?<![\p{L}\p{N}_.,])[-−+]?\d+(?:[,\u00a0\u202f]\d{3})*(?:\.\d+)?(?:st|nd|rd|th)?(?![\p{L}\p{N}_]|[,.]\d)/gu);
  return [...tokens].map(([token]) => Number(token.replace(/[,\u00a0\u202f]/g, '').replace('−', '-').replace(/(?:st|nd|rd|th)$/, '')));
}

export type Rejection = { index: number; id: string | null; reasons: string[]; atom: unknown };
export function verifyAtoms(candidates: readonly unknown[], sourceText: string, metadata: { date: string | null } = { date: null }) {
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
    for (const entity of atom.entities ?? []) {
      if (!entity.trim() || !atom.source_quote.includes(entity)) reasons.push(`entity_not_in_quote:${entity}`);
    }
    if (atom.kind === 'narrative' && atom.entities?.length && /\b(?:dead|failing|incompetent|dishonest)\b/i.test(atom.claim)) {
      reasons.push('negative_named_entity_claim');
    }
    const quotedNumbers = numericTokens(atom.source_quote);
    for (const [i, entry] of atom.values.entries()) {
      if (!quotedNumbers.includes(entry.value)) reasons.push(`values.${i}.value_not_in_quote`);
      if (entry.compare !== null && !quotedNumbers.includes(entry.compare)) reasons.push(`values.${i}.compare_not_in_quote`);
      if (numericTokens(entry.unit).some(n => !quotedNumbers.includes(n))) reasons.push(`values.${i}.unit_number_not_in_quote`);
      // Metadata is a separate provenance channel for the period only, never values.
      if (entry.period_source === 'metadata') {
        if (!metadata.date || !entry.period || entry.period !== metadata.date) {
          reasons.push(`values.${i}.period_not_in_metadata`);
        }
      } else if (entry.period !== null && numericTokens(entry.period).some(n => !quotedNumbers.includes(n))) {
        reasons.push(`values.${i}.period_number_not_in_quote`);
      }
    }
    // Narrative count words must be present as words too; this does not convert
    // 'ten' into numeric 10 or relax structured numeric-value checks.
    if (atom.kind === 'narrative') {
      const written = /\b(?:zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)\b/gi;
      const quotedWords = new Set((atom.source_quote.match(written) ?? []).map(word => word.toLowerCase()));
      for (const word of atom.claim.match(written) ?? []) {
        if (!quotedWords.has(word.toLowerCase())) reasons.push(`narrative_number_word_not_in_quote:${word.toLowerCase()}`);
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
