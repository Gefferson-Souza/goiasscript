import { translateRuntimeError } from '@goiasscript/compiler';
import type { RuntimeErrorContext, Tone } from '@goiasscript/compiler';
import { renderDiagnostic } from '../diagnostics/render-diagnostic.ts';
import { toolDiagnostic } from '../diagnostics/tool-diagnostic.ts';
import type { CliIo } from '../io.types.ts';
import { INPUT_ENDED_CODE, PENDING_PROGRAM_CODE } from './runtime-report.constants.ts';

type ReportIo = Pick<CliIo, 'err'>;

const hasCode = (error: unknown, code: string): boolean => typeof error === 'object' && error !== null && 'gsCode' in error && error.gsCode === code;

// Escrita síncrona: o processo pode encerrar logo depois e perder o que estiver na fila do stream.
export function reportRuntimeError(error: unknown, context: RuntimeErrorContext, io: ReportIo, tone: Tone): void {
  const diagnostic = hasCode(error, INPUT_ENDED_CODE) ? toolDiagnostic(INPUT_ENDED_CODE, tone) : translateRuntimeError(error, context, tone);
  io.err.writeSync(`${renderDiagnostic({ diagnostic, fileName: context.fileName, source: context.source })}\n`);
}

export function reportPendingProgram(io: ReportIo, tone: Tone, fileName: string): void {
  io.err.writeSync(`${renderDiagnostic({ diagnostic: toolDiagnostic(PENDING_PROGRAM_CODE, tone), fileName, source: null })}\n`);
}
