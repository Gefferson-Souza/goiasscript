import { runSmokeCli } from './smoke-playground-cli.ts';

const io = {
  out: (text: string) => process.stdout.write(text),
  err: (text: string) => process.stderr.write(text),
};

process.exitCode = await runSmokeCli(process.argv.slice(2), io, fetch);
