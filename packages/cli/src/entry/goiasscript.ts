import { runCli } from '../run-cli.ts';
import { createRealIo } from './real-io.ts';

process.exitCode = await runCli(process.argv.slice(2), createRealIo());
