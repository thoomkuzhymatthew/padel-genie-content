import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
export const TemplateSchema = z.strictObject({
  name: z.string().min(1), purpose: z.string().min(1), format: z.string().min(1),
  width: z.literal(1080), height: z.literal(1350),
  slides: z.strictObject({ min: z.number().int().positive(), max: z.number().int().positive() }),
  fields: z.array(z.strictObject({
    name: z.string().min(1), type: z.enum(['string', 'number', 'array']), required: z.boolean(),
    max_characters: z.number().int().positive().nullable(), max_items: z.number().int().positive().nullable(),
    min_items: z.number().int().positive().nullable(),
  })).min(1),
});
export type Template = z.infer<typeof TemplateSchema>;
export async function loadCatalogue(directory: string): Promise<Template[]> {
  const folders = (await readdir(directory, { withFileTypes: true })).filter(item => item.isDirectory()).map(item => item.name).sort();
  const result: Template[] = [];
  for (const name of folders) {
    let raw: string;
    try { raw = await readFile(join(directory, name, 'template.json'), 'utf8'); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue; throw error; }
    const descriptor = TemplateSchema.parse(JSON.parse(raw));
    if (descriptor.name !== name) throw new Error(`Template name must match folder: ${name}`);
    if (descriptor.slides.min > descriptor.slides.max) throw new Error(`Invalid slide limits: ${name}`);
    for (const field of descriptor.fields) {
      if (field.min_items !== null && field.max_items !== null && field.min_items > field.max_items) throw new Error(`Invalid field limits: ${name}/${field.name}`);
    }
    const names = descriptor.fields.map(field => field.name);
    if (new Set(names).size !== names.length) throw new Error(`Duplicate fields: ${name}`);
    result.push(descriptor);
  }
  if (!result.length) throw new Error('Template catalogue is empty');
  return result;
}
