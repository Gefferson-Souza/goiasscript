import { runGoiasScript } from '../../src/entry/cli.ts';

process.exitCode = await runGoiasScript(process.argv.slice(2));
