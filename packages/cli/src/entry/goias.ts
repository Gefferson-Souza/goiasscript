import { launchReal } from './real-launch.ts';

void launchReal(import.meta.url, (cli) => cli.runGoias(process.argv.slice(2)));
