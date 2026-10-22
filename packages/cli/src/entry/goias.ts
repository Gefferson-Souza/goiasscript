import { runGoias } from '../repl/run-goias.ts';
import { createRealIo } from './real-io.ts';

process.exitCode = await runGoias(process.argv.slice(2), createRealIo());
