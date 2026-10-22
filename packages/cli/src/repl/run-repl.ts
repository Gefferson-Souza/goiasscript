import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';

export function runRepl(io: Pick<CliIo, 'err'>): Promise<ExitCode> {
  io.err.write('Ô sô! A roda de prosa ainda tá sendo armada.\n');
  return Promise.resolve(EXIT_CODE.usage);
}
