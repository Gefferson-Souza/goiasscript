import type { CliIo } from '../io.types.ts';
import { OUTPUT_EXTENSION, OUTPUT_REASON, PATH_CODE, SOURCE_EXTENSION } from './paths.constants.ts';
import type { OutputPlan, OutputRequest, PathFailure } from './paths.types.ts';

const SEPARATORS = ['/', '\\'] as const;

const refuse = (reason: string, extra: Readonly<Record<string, string>> = {}): PathFailure => ({
  ok: false,
  code: PATH_CODE.outputRefused,
  detail: reason,
  args: { reason, ...extra },
});

const lastSeparatorIndex = (path: string): number => Math.max(...SEPARATORS.map((separator) => path.lastIndexOf(separator)));

function derivedPath(request: OutputRequest): string {
  const directoryPart = request.inputPath.slice(0, lastSeparatorIndex(request.inputPath) + 1);
  return `${directoryPart}${request.outputStem}${OUTPUT_EXTENSION}`;
}

async function isSameFile(inputPath: string, outputPath: string, io: CliIo): Promise<boolean> {
  const resolve = (path: string): string => io.env.path.resolve(io.env.cwd, path);
  if (resolve(inputPath) === resolve(outputPath)) return true;
  const [inputIdentity, outputIdentity] = await Promise.all([io.fs.identity(inputPath), io.fs.identity(outputPath)]);
  return inputIdentity !== null && inputIdentity === outputIdentity;
}

async function refuseUnusableTarget(outputPath: string, io: CliIo): Promise<PathFailure | null> {
  if (outputPath.toLowerCase().endsWith(SOURCE_EXTENSION)) return refuse(OUTPUT_REASON.endsWithGs);
  const separatorIndex = lastSeparatorIndex(outputPath);
  if (separatorIndex > 0 && (await io.fs.stat(outputPath.slice(0, separatorIndex))) !== 'directory') {
    return { ok: false, code: PATH_CODE.usage, detail: OUTPUT_REASON.missingParent };
  }
  return null;
}

export async function planOutput(request: OutputRequest, io: CliIo): Promise<OutputPlan> {
  const outputPath = request.outputOption ?? derivedPath(request);
  if (await isSameFile(request.inputPath, outputPath, io)) return refuse(OUTPUT_REASON.sameFile);
  const targetKind = await io.fs.stat(outputPath);
  if (targetKind === 'directory') return refuse(OUTPUT_REASON.isDirectory);
  const unusable = await refuseUnusableTarget(outputPath, io);
  if (unusable) return unusable;
  if (targetKind === 'other') return refuse(OUTPUT_REASON.notRegularFile);
  if (targetKind === 'file' && !request.overwrite) return refuse(OUTPUT_REASON.exists, { override: request.override });
  return { ok: true, outputPath, replacing: targetKind === 'file' };
}
