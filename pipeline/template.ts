export type JsonRecord = Record<string, unknown>;
export function lookup(value: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => node && typeof node === 'object' ? (node as JsonRecord)[key] : undefined, value);
}
export function fieldValues(content: JsonRecord, path: string): unknown[] {
  const parts = path.split('.');
  const visit = (node: unknown, index: number): unknown[] => {
    if (index === parts.length) return [node];
    const key = parts[index], array = key.endsWith('[]');
    const value = node && typeof node === 'object' ? (node as JsonRecord)[array ? key.slice(0, -2) : key] : undefined;
    if (array) return Array.isArray(value) ? value.flatMap(item => visit(item, index + 1)) : [undefined];
    return visit(value, index + 1);
  };
  return visit(content, 0);
}
export const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
export function fillTemplate(html: string, content: JsonRecord): string {
  return html.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (_, key: string, body: string) => {
    const items = content[key];
    if (!Array.isArray(items)) throw new Error(`Missing template array: ${key}`);
    return items.map(item => fillTemplate(body, { ...content, ...(item as JsonRecord) })).join('');
  }).replace(/{{([\w.]+)}}/g, (_, key: string) => escapeHtml(lookup(content, key)));
}
