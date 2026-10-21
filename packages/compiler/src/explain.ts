import { lookupDiagnostic } from '@goiasscript/language';
import type { DiagnosticExplanation, Tone } from './api.types.ts';
import { EXPLAIN_PLACEHOLDERS, EXPLAIN_PLACEHOLDER_FALLBACK } from './diagnostics/explain-placeholders.constants.ts';
import { formatMessage } from './diagnostics/format-message.ts';

const MARKER_NAME = /\{(\w+)\}/gu;

function placeholdersFor(text: string): Readonly<Record<string, string>> {
  const keys = [...text.matchAll(MARKER_NAME)].map((match) => match[1] ?? '');
  return Object.fromEntries(keys.map((key) => [key, EXPLAIN_PLACEHOLDERS[key] ?? EXPLAIN_PLACEHOLDER_FALLBACK]));
}

export function explainDiagnostic(code: string, tone: Tone = 'raiz'): DiagnosticExplanation | null {
  const definition = lookupDiagnostic(code);
  if (definition === undefined) return null;
  const parts = [definition.messages[tone], definition.help?.[tone]].filter((part): part is string => part !== undefined);
  const text = parts.join(' ');
  return { code: definition.code, title: definition.title, explanation: formatMessage(text, placeholdersFor(text)), example: definition.example, lesson: definition.lesson ?? '' };
}
