import { z } from 'zod';
export const IdeaSchema = z.strictObject({
  id: z.string().min(1), format: z.string().min(1), template: z.string().min(1),
  story: z.string().min(1).max(220).regex(/[.!?]$/, 'Story must end as a complete sentence'), atoms: z.array(z.string().min(1)).min(1),
  main_atoms: z.array(z.string().min(1)).min(1),
  named_examples: z.array(z.string().min(1)).max(5),
  hold_back_atoms: z.array(z.string().min(1)).min(1),
  angle: z.string().min(1).max(70),
  hold_back: z.string().min(1).max(180), why_it_works: z.string().min(1).max(320),
  score: z.number().min(0).max(10), rank: z.number().int().min(1).max(8),
  improve: z.string().min(1).max(240),
});
export const IdeasSchema = z.strictObject({ ideas: z.array(IdeaSchema).min(6).max(8) });
export type Idea = z.infer<typeof IdeaSchema>;
