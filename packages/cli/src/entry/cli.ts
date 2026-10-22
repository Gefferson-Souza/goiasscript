import { runGoias as runReplCommand } from '../repl/run-goias.ts';
import { runCli } from '../run-cli.ts';
import { createRealIo } from './real-io.ts';
import { createRealProcessHost } from './real-process-host.ts';

export const runGoiasScript = (argv: readonly string[]): Promise<number> =>
  runCli(argv, createRealIo(), { processHost: createRealProcessHost() });

export const runGoias = (argv: readonly string[]): Promise<number> => runReplCommand(argv, createRealIo());
