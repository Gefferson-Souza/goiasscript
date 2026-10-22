import type { ToolNoticeRequest } from './tool-notice.types.ts';
import { lookupDiagnostic } from '@goiasscript/language';

const OPTIONAL_SEGMENT = /\[\[(.*?)\]\]/gu;
const MARKER = /\{(\w+)\}/gu;
const LINE_INDENT = '  ';
const SEVERITY_LABEL = { error: 'erro', warning: 'aviso' } as const;

function fillTemplate(template: string, args: Readonly<Record<string, string>>): string {
  const visible = template.replace(OPTIONAL_SEGMENT, (_match, inner: string) =>
    [...inner.matchAll(MARKER)].every((marker) => args[marker[1] ?? ''] !== undefined) ? inner : '');
  return visible.replace(MARKER, (_match, key: string) => args[key] ?? '');
}

export function renderToolNotice(request: ToolNoticeRequest): string {
  const definition = lookupDiagnostic(request.code);
  if (definition === undefined) throw new Error(`Código ${request.code} fora do catálogo.`);
  const message = fillTemplate(definition.messages[request.tone], request.args ?? {});
  const head = `${SEVERITY_LABEL[definition.severity]} ${request.code}: ${message}`;
  return [head, ...(request.lines ?? []).map((line) => `${LINE_INDENT}${line}`)].join('\n') + '\n';
}
