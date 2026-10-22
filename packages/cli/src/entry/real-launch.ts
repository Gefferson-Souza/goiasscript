import { launch } from '../bootstrap/launch.ts';
import type { CliEntryPoints } from '../bootstrap/launch.types.ts';

// O módulo do CLI fica ao lado do binário; o chunk compartilhado mora em outra pasta.
export function launchReal(binaryUrl: string, start: (cli: CliEntryPoints) => Promise<number>): Promise<void> {
  return launch(
    {
      nodeVersion: process.versions.node,
      loadCli: () => import(new URL('./cli.mjs', binaryUrl).href) as Promise<CliEntryPoints>,
      writeError: (text) => void process.stderr.write(text),
      setExitCode(code) {
        process.exitCode = code;
      },
    },
    start,
  );
}
