import { z } from 'zod';
export const AtomSchema = z.strictObject({
  id: z.string().min(1),
  claim: z.string().min(1),
  values: z.array(z.strictObject({
    value: z.number().finite(),
    unit: z.string().min(1),
    compare: z.number().finite().nullable(),
    period: z.string().nullable(),
  })),
  place: z.string().nullable(),
  source_quote: z.string().min(1),
});
export const AtomsSchema = z.strictObject({ atoms: z.array(AtomSchema) });
export type Atom = z.infer<typeof AtomSchema>;
