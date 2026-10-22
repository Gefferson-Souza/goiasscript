import type { CommandId } from '../args/args.types.ts';
import { checkCommand } from './check.ts';
import type { CommandHandler } from './command.types.ts';
import { explainCommand } from './explain.ts';
import { infoCommand } from './info.ts';
import { runCommand } from './run.ts';
import { scaffoldCommand } from './scaffold.ts';
import { translateCommand } from './translate.ts';

export const COMMAND_HANDLERS: Readonly<Record<CommandId, CommandHandler>> = {
  translate: translateCommand,
  run: runCommand,
  check: checkCommand,
  scaffold: scaffoldCommand,
  explain: explainCommand,
  info: infoCommand,
};
