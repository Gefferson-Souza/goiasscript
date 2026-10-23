import { nodeExecFile } from '../commands/node-exec-file.ts';
import { nodeSpawnProgram } from '../commands/node-spawn-program.ts';
import { runProgram } from '../commands/run-program.ts';
import { runTranslate } from '../commands/run-translate.ts';
import type { Feature } from '../host/extension-host.types.ts';

export const TRANSLATE_COMMAND_ID = 'goiasscript.translate';
export const RUN_COMMAND_ID = 'goiasscript.run';

export const commandsFeature: Feature = {
  activate: (host) => {
    const deps = { host, execFile: nodeExecFile, spawnProgram: nodeSpawnProgram, runtimePath: process.execPath };
    const registrations = [host.registerCommand(TRANSLATE_COMMAND_ID, runTranslate(deps)), host.registerCommand(RUN_COMMAND_ID, runProgram(deps))];
    return {
      dispose: () => {
        registrations.forEach((registration) => {
          registration.dispose();
        });
      },
    };
  },
};
