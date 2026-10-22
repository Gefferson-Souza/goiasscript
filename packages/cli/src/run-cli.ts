import { EXIT_CODE } from './exit-codes.constants.ts';
import type { ExitCode } from './exit-codes.types.ts';
import type { CliIo } from './io.types.ts';
import { VERSION } from './version.ts';

export function runCli(_argv: readonly string[], io: CliIo): Promise<ExitCode> {
  io.err.write(`GoiásScript ${VERSION}: ô sô, esse trem ainda tá sendo armado.\n`);
  return Promise.resolve(EXIT_CODE.usage);
}
