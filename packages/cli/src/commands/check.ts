import { EXIT_CODE } from '../exit-codes.constants.ts';
import { printableName } from '../paths/display-text.ts';
import { chooseByTone } from '../tone-choice.ts';
import { CHECK_TEXT } from './check.constants.ts';
import type { CommandHandler } from './command.types.ts';
import { compileSource } from './compile-source.ts';
import { reportDiagnostics } from './report-diagnostics.ts';

export const checkCommand: CommandHandler = async ({ io, parsed }) => {
  const { tone, json } = parsed.options;
  const [inputArg = ''] = parsed.positionals;
  const compiled = await compileSource({ inputArg, tone, json }, io);
  if (compiled.kind === 'failed') return compiled.exit;
  const file = compiled.input.displayName;
  if (json) reportDiagnostics(io, { file, source: compiled.source, diagnostics: compiled.result.diagnostics, json });
  else io.out.write(`${chooseByTone(tone, CHECK_TEXT.ok.root, CHECK_TEXT.ok.neutral)} ${printableName(file)}.\n`);
  return EXIT_CODE.ok;
};
