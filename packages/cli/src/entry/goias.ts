import { runRepl } from '../repl/run-repl.ts';
import { createRealIo } from './real-io.ts';

process.exitCode = await runRepl(createRealIo());
