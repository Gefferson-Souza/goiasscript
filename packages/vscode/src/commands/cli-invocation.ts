import path from 'node:path';
import { ELECTRON_RUN_AS_NODE, END_OF_OPTIONS, FORWARDED_ENV_KEYS, MAX_OUTPUT_BYTES, OVERWRITE_FLAG, TONE_FLAG } from './commands.constants.ts';
import type { CliInvocation, CliInvocationInput } from './commands.types.ts';

type EnvSource = Readonly<Record<string, string | undefined>>;

// Só o necessário passa ao filho: NODE_OPTIONS, LD_PRELOAD e afins do host não podem carregar código dentro do CLI.
function pickEnv(source: EnvSource): Readonly<Record<string, string>> {
  const forwarded = FORWARDED_ENV_KEYS.flatMap((key) => {
    const value = source[key];
    return value === undefined ? [] : [[key, value] as const];
  });
  return { ...Object.fromEntries(forwarded), [ELECTRON_RUN_AS_NODE]: '1' };
}

export function buildCliInvocation(input: CliInvocationInput): CliInvocation {
  const overwriteArgs = input.overwrite ? [OVERWRITE_FLAG] : [];
  return {
    file: input.runtimePath,
    args: [input.cliEntry, input.command, TONE_FLAG, input.tone, ...overwriteArgs, END_OF_OPTIONS, input.documentPath],
    options: { cwd: path.dirname(input.documentPath), env: pickEnv(input.hostEnv ?? process.env), windowsHide: true, maxBuffer: MAX_OUTPUT_BYTES },
  };
}
