import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CommandContext } from './command.types.ts';

export function notReady({ io }: CommandContext): Promise<ExitCode> {
  io.err.write('Ô sô, esse comando ainda tá sendo armado.\n');
  return Promise.resolve(EXIT_CODE.usage);
}
