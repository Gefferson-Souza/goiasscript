import type { Tone } from '@goiasscript/compiler';
import { renderDiagnostic } from '../diagnostics/render-diagnostic.ts';
import { renderJsonReport } from '../diagnostics/json-report.ts';
import { toolDiagnostic } from '../diagnostics/tool-diagnostic.ts';
import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';
import type { ReportRequest, ToolFailure } from './compile-source.types.ts';

export function reportDiagnostics(io: CliIo, request: ReportRequest): void {
  if (request.json) {
    io.out.write(renderJsonReport({ file: request.file, diagnostics: request.diagnostics }));
    return;
  }
  request.diagnostics.forEach((diagnostic) => {
    io.err.write(`${renderDiagnostic({ diagnostic, fileName: request.file, source: request.source })}\n`);
  });
}

export function reportToolFailure(io: CliIo, failure: ToolFailure, context: { readonly tone: Tone; readonly json: boolean; readonly file: string }): ExitCode {
  const diagnostic = toolDiagnostic(failure.code, context.tone, failure.args, failure.detail);
  reportDiagnostics(io, { file: context.file, source: null, diagnostics: [diagnostic], json: context.json });
  return EXIT_CODE.usage;
}
