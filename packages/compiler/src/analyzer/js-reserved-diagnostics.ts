import { VARIANT_ARG } from '@goiasscript/language';
import type { JsReservedEntry } from '@goiasscript/language';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import { CODES } from './codes.constants.ts';
import { diagnostic } from './diagnostic.ts';
import { NODE_ONLY_GLOBALS, NO_EQUIVALENT_VARIANT, NODE_FEATURE_VARIANT } from './js-reserved-diagnostics.constants.ts';

export const reservedWordArgs = (name: string, reserved: JsReservedEntry): Readonly<Record<string, string>> =>
  reserved.suggestion === undefined ? { name } : { name, suggestion: reserved.suggestion };

// Sem palavra goiana equivalente, o erro diz que o recurso não existe em vez de sugerir um nome inventado.
export function jsGlobalDiagnostic(reserved: JsReservedEntry, start: number, end: number): RawDiagnostic {
  if (reserved.suggestion !== undefined) return diagnostic(CODES.jsGlobal, start, end, reservedWordArgs(reserved.name, reserved));
  const variant = NODE_ONLY_GLOBALS.has(reserved.name) ? NODE_FEATURE_VARIANT : NO_EQUIVALENT_VARIANT;
  return diagnostic(CODES.jsGlobal, start, end, { name: reserved.name, [VARIANT_ARG]: variant });
}

