import { runCli } from '../run-cli.ts';
import { createRealIo } from './real-io.ts';
import { createRealProcessHost } from './real-process-host.ts';

process.exitCode = await runCli(process.argv.slice(2), createRealIo(), { processHost: createRealProcessHost() });
