import type { CommandHandler } from './command.types.ts';
import { notReady } from './not-ready.ts';

export const checkCommand: CommandHandler = notReady;
