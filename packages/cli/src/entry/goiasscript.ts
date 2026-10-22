import { launchReal } from './real-launch.ts';

void launchReal(import.meta.url, (cli) => cli.runGoiasScript(process.argv.slice(2)));
