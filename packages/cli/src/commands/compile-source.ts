import { compile } from '@goiasscript/compiler';
import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';
import { decodeSource } from '../paths/decode-source.ts';
import { validateInputName } from '../paths/input-name.ts';
import { PATH_CODE, STDIN_ARGUMENT, STDIN_DISPLAY_NAME } from '../paths/paths.constants.ts';
import { readSource } from '../paths/read-source.ts';
import type { CompileRequest, CompiledSource } from './compile-source.types.ts';
import { reportDiagnostics, reportToolFailure } from './report-diagnostics.ts';

const failed = (exit: ExitCode): CompiledSource => ({ kind: 'failed', exit });

export async function compileSource(request: CompileRequest, io: CliIo): Promise<CompiledSource> {
  const { tone, json } = request;
  const isStdin = request.inputArg === STDIN_ARGUMENT;
  const name = isStdin ? null : validateInputName(request.inputArg, io.env.path, io.env.platform);
  if (name !== null && !name.ok) return failed(reportToolFailure(io, name, { tone, json, file: request.inputArg }));
  const read = await readSource(request.inputArg, io);
  if (!read.ok) return failed(reportToolFailure(io, read, { tone, json, file: isStdin ? STDIN_DISPLAY_NAME : request.inputArg }));
  const { displayName } = read.input;
  const decoded = decodeSource(read.bytes);
  if (!decoded.ok) return failed(reportToolFailure(io, { code: PATH_CODE.usage, detail: decoded.detail }, { tone, json, file: displayName }));
  const result = compile(decoded.text, { fileName: displayName, target: 'module', tone, sourceMap: false });
  if (!result.ok) {
    reportDiagnostics(io, { file: displayName, source: decoded.text, diagnostics: result.diagnostics, json });
    return failed(EXIT_CODE.compilation);
  }
  if (!json) reportDiagnostics(io, { file: displayName, source: decoded.text, diagnostics: result.diagnostics, json });
  return { kind: 'ok', result, source: decoded.text, input: read.input, outputStem: name?.ok ? name.outputStem : null };
}
