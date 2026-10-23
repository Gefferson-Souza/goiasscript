import type { Diagnostic, Tone } from '@goiasscript/compiler';
import { COLLOQUIAL_TEXTS, HOST_DIAGNOSTIC_CODE, NEUTRAL_TEXTS } from './host-diagnostics.constants.ts';
import type { HostDiagnosticKind } from './host-diagnostics.types.ts';

const ORIGIN = { offset: 0, line: 1, column: 1 } as const;

export function hostDiagnostic(kind: HostDiagnosticKind, tone: Tone): Diagnostic {
  const { message, help } = (tone === 'neutro' ? NEUTRAL_TEXTS : COLLOQUIAL_TEXTS)[kind];
  return { code: HOST_DIAGNOSTIC_CODE, severity: 'error', range: { start: ORIGIN, end: ORIGIN }, message, help };
}
