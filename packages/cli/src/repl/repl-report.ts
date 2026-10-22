import type { Diagnostic, Tone } from '@goiasscript/compiler';
import { toPrintableMultiline } from '../args/printable-text.ts';
import { renderDiagnostic } from '../diagnostics/render-diagnostic.ts';
import type { CliIo } from '../io.types.ts';
import { REPL_FILE_NAME } from './repl.constants.ts';
import type { ReplEvaluation } from './repl.types.ts';
import { interruptedText } from './repl-messages.ts';

type ReplIo = Pick<CliIo, 'out' | 'err'>;

function reportDiagnostics(io: ReplIo, diagnostics: readonly Diagnostic[], source: string): void {
  diagnostics.forEach((diagnostic) => {
    io.err.write(`${renderDiagnostic({ diagnostic, fileName: REPL_FILE_NAME, source })}\n`);
  });
}

export function reportEvaluation(io: ReplIo, tone: Tone, result: ReplEvaluation, source: string): void {
  if (result.kind === 'failed') reportDiagnostics(io, result.diagnostics, source);
  else if (result.kind === 'threw') reportDiagnostics(io, [result.diagnostic], source);
  else if (result.kind === 'interrupted') io.err.write(interruptedText(tone));
  else if (result.kind === 'done') {
    reportDiagnostics(io, result.diagnostics, source);
    if (result.echo !== undefined) io.out.write(`${toPrintableMultiline(result.echo)}\n`);
  }
}

export const isAccepted = (result: ReplEvaluation): boolean => result.kind === 'done' || result.kind === 'threw';
