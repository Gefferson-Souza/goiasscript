import type { Diagnostic, RuntimeErrorContext, Tone } from '../api.types.ts';
import { formatDiagnostic } from '../diagnostics/format.ts';
import { translateRuntimeErrorCore } from './translate-core.ts';

export const translateRuntimeError = (error: unknown, context: RuntimeErrorContext, tone: Tone = 'raiz'): Diagnostic =>
  formatDiagnostic(translateRuntimeErrorCore(error, context), tone);
