import { z } from 'zod';
export const AtomValueSchema = z.strictObject({
  value: z.number().finite(),
  unit: z.string().min(1),
  compare: z.number().finite().nullable(),
  period: z.string().nullable(),
  // Legacy runs without this field retain quote-based period verification.
  period_source: z.enum(['quote', 'metadata']).optional(),
});
export const AtomSchema = z.strictObject({
  id: z.string().min(1), claim: z.string().min(1),
  kind: z.enum(['numeric', 'narrative']).optional(),
  entities: z.array(z.string().min(1)).optional(),
  certainty: z.enum(['reported', 'provisional', 'projected']).optional(),
  values: z.array(AtomValueSchema), place: z.string().nullable(),
  source_quote: z.string().min(1),
});
export const AtomsSchema = z.strictObject({ atoms: z.array(AtomSchema.required({ kind: true, entities: true, certainty: true }).extend({
  values: z.array(AtomValueSchema.required({ period_source: true })),
})) });
export type Atom = z.infer<typeof AtomSchema>;
