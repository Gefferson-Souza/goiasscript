import { lookupDiagnostic } from '@goiasscript/language';
import type { Diagnostic, Tone } from '../api.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import type { SourceText } from '../source/source.types.ts';
import { rangeOf } from '../source/source-text.ts';
import { formatMessage } from './format-message.ts';

export function toDiagnostic(raw: RawDiagnostic, source: SourceText, tone: Tone): Diagnostic {
  const definition = lookupDiagnostic(raw.code);
  const range = rangeOf(source, raw.start, raw.end);
  if (definition === undefined) return { code: raw.code, severity: 'error', range, message: raw.code };
  const help = definition.help?.[tone];
  return {
    code: raw.code,
    severity: definition.severity,
    range,
    message: formatMessage(definition.messages[tone], raw.args),
    ...(help === undefined ? {} : { help: formatMessage(help, raw.args) }),
    ...(definition.lesson === undefined ? {} : { lesson: definition.lesson }),
  };
}
