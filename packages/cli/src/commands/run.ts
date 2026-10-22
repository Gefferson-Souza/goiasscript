import { compileSource } from './compile-source.ts';
import type { CommandHandler } from './command.types.ts';
import { runProgram } from '../run/program-runner.ts';

export const runCommand: CommandHandler = async ({ io, parsed, dependencies }) => {
  const { tone, json } = parsed.options;
  const [inputArg = ''] = parsed.positionals;
  const compiled = await compileSource({ inputArg, tone, json, sourceMap: true }, io);
  if (compiled.kind === 'failed') return compiled.exit;
  return runProgram({ result: compiled.result, source: compiled.source, displayName: compiled.input.displayName, tone }, io, dependencies.processHost);
};
