import { EXIT_CODE } from '../exit-codes.constants.ts';
import { isSupportedNode } from '../node-version.ts';
import { OLD_NODE_FALLBACK_NOTICE } from './launch.constants.ts';
import type { CliEntryPoints, LaunchDependencies } from './launch.types.ts';

// Abaixo do Node mínimo o bundle pode nem parsear; o aviso sai daqui, sem depender dele.
export async function launch(dependencies: LaunchDependencies, start: (cli: CliEntryPoints) => Promise<number>): Promise<void> {
  try {
    const cli = await dependencies.loadCli();
    dependencies.setExitCode(await start(cli));
  } catch (error) {
    if (isSupportedNode(dependencies.nodeVersion)) throw error;
    dependencies.writeError(OLD_NODE_FALLBACK_NOTICE);
    dependencies.setExitCode(EXIT_CODE.runtime);
  }
}
