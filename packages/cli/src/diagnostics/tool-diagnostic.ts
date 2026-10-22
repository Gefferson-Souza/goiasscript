import type { Tone } from '@goiasscript/compiler';
import { formatMessage, lookupDiagnostic } from '@goiasscript/language';
import type { ToolDiagnostic } from './diagnostic.types.ts';

export function toolDiagnostic(code: string, tone: Tone, args: Readonly<Record<string, string>> = {}, detail?: string): ToolDiagnostic {
  const definition = lookupDiagnostic(code);
  if (definition === undefined) return { code, severity: 'error', message: code, ...(detail === undefined ? {} : { detail }) };
  const help = definition.help?.[tone];
  return {
    code,
    severity: definition.severity,
    message: formatMessage(definition.messages[tone], args),
    ...(help === undefined ? {} : { help: formatMessage(help, args) }),
    ...(detail === undefined ? {} : { detail }),
  };
}
