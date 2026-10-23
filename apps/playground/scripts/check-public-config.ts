import { loadEnvFile } from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadEnvFiles, runPublicConfigCheck } from '../config/public-config-cli.ts';

loadEnvFiles(fileURLToPath(new URL('..', import.meta.url)), loadEnvFile);

const io = {
  out: (text: string) => process.stdout.write(text),
  err: (text: string) => process.stderr.write(text),
};

process.exitCode = await runPublicConfigCheck(process.argv.slice(2), process.env, io, fetch);
