import { CliFileError } from '../cli-file-error.ts';
import type { CliIo } from '../io.types.ts';
import { PATH_CODE, STDIN_ARGUMENT, STDIN_DISPLAY_NAME } from './paths.constants.ts';
import type { PathFailure, SourceRead } from './paths.types.ts';

const usageFailure = (detail: string): PathFailure => ({ ok: false, code: PATH_CODE.usage, detail });

function describeReadError(inputArg: string, error: unknown): PathFailure {
  const code = error instanceof CliFileError ? error.code : 'OTHER';
  if (code === 'ENOENT' || code === 'ENOTDIR') return usageFailure(`não achei o arquivo "${inputArg}"`);
  if (code === 'EACCES') return usageFailure(`sem permissão pra ler "${inputArg}"`);
  return usageFailure(`não consegui ler "${inputArg}"`);
}

export async function readSource(inputArg: string, io: CliIo): Promise<SourceRead> {
  if (inputArg === STDIN_ARGUMENT) {
    return { ok: true, input: { kind: 'stdin', displayName: STDIN_DISPLAY_NAME }, bytes: await io.stdin.readAll() };
  }
  const kind = await io.fs.stat(inputArg);
  if (kind === 'missing') return usageFailure(`não achei o arquivo "${inputArg}"`);
  if (kind !== 'file') return usageFailure(`"${inputArg}" não é um arquivo`);
  try {
    return { ok: true, input: { kind: 'file', path: inputArg, displayName: inputArg }, bytes: await io.fs.readBytes(inputArg) };
  } catch (error) {
    return describeReadError(inputArg, error);
  }
}
