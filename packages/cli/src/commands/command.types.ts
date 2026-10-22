import type { ParsedCommand } from '../args/args.types.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';
import type { ProcessHost } from '../run/process-host.types.ts';

export interface CliDependencies {
  readonly processHost: ProcessHost;
}

export interface CommandContext {
  readonly io: CliIo;
  readonly parsed: ParsedCommand;
  readonly dependencies: CliDependencies;
}

export type CommandHandler = (context: CommandContext) => Promise<ExitCode>;
