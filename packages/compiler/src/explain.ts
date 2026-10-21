import { lookupDiagnostic } from '@goiasscript/language';
import type { DiagnosticExplanation, Tone } from './api.types.ts';
import { formatMessage } from './diagnostics/format-message.ts';

export function explainDiagnostic(code: string, tone: Tone = 'raiz'): DiagnosticExplanation | null {
  const definition = lookupDiagnostic(code);
  if (definition === undefined) return null;
  const parts = [definition.messages[tone], definition.help?.[tone]].filter((part): part is string => part !== undefined);
  return { code: definition.code, title: definition.title, explanation: formatMessage(parts.join(' '), {}), example: definition.example, lesson: definition.lesson ?? '' };
}
