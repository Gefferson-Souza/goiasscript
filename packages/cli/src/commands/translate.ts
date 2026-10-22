import { CliFileError } from '../cli-file-error.ts';
import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';
import { printableName } from '../paths/display-text.ts';
import { planOutput } from '../paths/output-plan.ts';
import { PATH_CODE, STDIN_DISPLAY_NAME } from '../paths/paths.constants.ts';
import type { OutputPlan } from '../paths/paths.types.ts';
import { chooseByTone } from '../tone-choice.ts';
import { compileSource } from './compile-source.ts';
import type { CompiledSource } from './compile-source.types.ts';
import type { CommandContext, CommandHandler } from './command.types.ts';
import { generateCode } from './emit-output.ts';
import { reportDiagnostics, reportToolFailure } from './report-diagnostics.ts';
import { OVERWRITE_FLAG, TRANSLATE_TEXT, WRITE_EXISTS_REASON } from './translate.constants.ts';

type Compiled = Extract<CompiledSource, { kind: 'ok' }>;

function planFor(compiled: Compiled, { io, parsed }: CommandContext): Promise<OutputPlan> | null {
  const { output } = parsed.options;
  if (compiled.input.kind === 'stdin' && output === undefined) return null;
  const inputPath = compiled.input.kind === 'file' ? compiled.input.path : STDIN_DISPLAY_NAME;
  return planOutput(
    { inputPath, outputStem: compiled.outputStem ?? '', ...(output === undefined ? {} : { outputOption: output }), overwrite: parsed.options.overwrite, override: OVERWRITE_FLAG },
    io,
  );
}

async function writeOutput(io: CliIo, plan: Extract<OutputPlan, { ok: true }>, code: string): Promise<{ readonly code: string; readonly detail: string } | null> {
  try {
    await io.fs.writeText(plan.outputPath, code, plan.replacing ? 'replace' : 'create-new');
    return null;
  } catch (error) {
    if (error instanceof CliFileError && error.code === 'EEXIST') return { code: PATH_CODE.outputRefused, detail: WRITE_EXISTS_REASON };
    return { code: PATH_CODE.outputRefused, detail: '' };
  }
}

export const translateCommand: CommandHandler = async (context) => {
  const { io, parsed } = context;
  const { tone, json } = parsed.options;
  const [inputArg = ''] = parsed.positionals;
  const compiled = await compileSource({ inputArg, tone, json }, io);
  if (compiled.kind === 'failed') return compiled.exit;
  const file = compiled.input.displayName;
  const plan = await planFor(compiled, context);
  if (plan !== null && !plan.ok) return reportToolFailure(io, plan, { tone, json, file });
  const code = await generateCode(compiled.result, parsed.options, io);
  if (plan === null) {
    if (json) reportDiagnostics(io, { file, source: compiled.source, diagnostics: compiled.result.diagnostics, json });
    else io.out.write(code);
    return EXIT_CODE.ok;
  }
  const failure = await writeOutput(io, plan, code);
  if (failure !== null) {
    const detail = failure.detail === '' ? chooseByTone(tone, TRANSLATE_TEXT.writeFailed.root, TRANSLATE_TEXT.writeFailed.neutral) : failure.detail;
    return reportToolFailure(io, { code: failure.code, detail, args: { reason: detail, ...(failure.detail === '' ? {} : { override: OVERWRITE_FLAG }) } }, { tone, json, file });
  }
  return finish(context, compiled, file, plan.outputPath);
};

function finish(context: CommandContext, compiled: Compiled, file: string, outputPath: string): ExitCode {
  const { io, parsed } = context;
  if (parsed.options.json) reportDiagnostics(io, { file, source: compiled.source, diagnostics: compiled.result.diagnostics, json: true });
  else io.out.write(`${chooseByTone(parsed.options.tone, TRANSLATE_TEXT.done.root, TRANSLATE_TEXT.done.neutral)} ${printableName(outputPath)}\n`);
  return EXIT_CODE.ok;
}
