import type { DiagnosticDefinition, DiagnosticSeverity, ToneKey } from './diagnostics.types.ts';

type Tones = Readonly<Record<ToneKey, string>>;
interface Extra {
  readonly help?: Tones;
  readonly lesson?: string;
}

const FIRST_VERSION = '3.0.0';
const ROOT_TONE = 'raiz';
const NEUTRAL_TONE = 'neutro';

export const tones = (root: string, neutral: string): Tones => ({ [ROOT_TONE]: root, [NEUTRAL_TONE]: neutral });

export function defineDiagnostic(code: string, severity: DiagnosticSeverity, title: string, messages: Tones, example: string, extra: Extra = {}): DiagnosticDefinition {
  return { code, severity, title, messages, example, since: FIRST_VERSION, ...extra };
}
