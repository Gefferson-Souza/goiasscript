const OPTIONAL_SEGMENT = /\[\[(.*?)\]\]/gu;
const MARKER = /\{(\w+)\}/gu;

export function formatMessage(template: string, args: Readonly<Record<string, string>>): string {
  const visible = template.replace(OPTIONAL_SEGMENT, (_match, inner: string) =>
    [...inner.matchAll(MARKER)].every((marker) => args[marker[1] ?? ''] !== undefined) ? inner : '');
  return visible.replace(MARKER, (_match, key: string) => args[key] ?? `«${key}»`);
}
