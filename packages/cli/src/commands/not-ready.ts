import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import { chooseByTone } from '../tone-choice.ts';
import type { CommandContext } from './command.types.ts';
import { NOT_READY_MESSAGE } from './not-ready.constants.ts';

export function notReady({ io, parsed }: CommandContext): Promise<ExitCode> {
  io.err.write(chooseByTone(parsed.options.tone, NOT_READY_MESSAGE.root, NOT_READY_MESSAGE.neutral));
  return Promise.resolve(EXIT_CODE.usage);
}
