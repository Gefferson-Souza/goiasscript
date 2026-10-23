import { loadEnvFile } from 'node:process';
import { loadEnvFiles, runPublicConfigCheck } from '../config/public-config-cli.ts';

loadEnvFiles(new URL('..', import.meta.url).pathname, loadEnvFile);

const io = {
  out: (text: string) => process.stdout.write(text),
  err: (text: string) => process.stderr.write(text),
};

process.exitCode = await runPublicConfigCheck(process.argv.slice(2), process.env, io, fetch);
