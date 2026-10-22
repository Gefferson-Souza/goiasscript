import type { CompileSuccess } from '@goiasscript/compiler';
import type { CommandOptions } from '../args/args.types.ts';
import { chooseByTone } from '../tone-choice.ts';
import { TRANSLATE_TEXT } from './translate.constants.ts';
import type { CliIo } from '../io.types.ts';

const withFinalNewline = (code: string): string => (code.endsWith('\n') ? code : `${code}\n`);

export async function generateCode(result: CompileSuccess, options: CommandOptions, io: CliIo): Promise<string> {
  if (!options.optimize && !options.minify) return result.code;
  try {
    const { optimize } = await import('@goiasscript/optimizer');
    return withFinalNewline((await optimize(result, { minify: options.minify })).code);
  } catch {
    io.err.write(chooseByTone(options.tone, TRANSLATE_TEXT.optimizeFailed.root, TRANSLATE_TEXT.optimizeFailed.neutral));
    return result.code;
  }
}
