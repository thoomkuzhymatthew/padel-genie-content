import { z } from 'zod';
export const IdeaSchema = z.strictObject({
  id: z.string().min(1), format: z.string().min(1), template: z.string().min(1),
  story: z.string().min(1).max(160), atoms: z.array(z.string().min(1)).min(1),
  hold_back: z.string().min(1).max(180), why_it_works: z.string().min(1).max(320),
  score: z.number().min(0).max(10),
});
export const IdeasSchema = z.strictObject({ ideas: z.array(IdeaSchema).max(8) });
export type Idea = z.infer<typeof IdeaSchema>;
