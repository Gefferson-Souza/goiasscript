import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHECK_FLAG, WRITE_FLAG } from '../lib/cartilha/lesson-index.constants.ts';
import { buildLessonIndex, renderExtensionTerms, renderPlaygroundIndex } from '../lib/cartilha/lesson-index.ts';
import { loadLessons } from '../lib/cartilha/load-lessons.ts';
import type { LessonIndexIo, LessonIndexMode, LessonIndexTargets } from './build-lesson-index.types.ts';

const readOrEmpty = (io: LessonIndexIo, path: string): string => {
  try {
    return io.read(path);
  } catch {
    return '';
  }
};

export function runBuildLessonIndex(targets: LessonIndexTargets, io: LessonIndexIo): number {
  const { lessons, problems } = loadLessons(targets.contentDir);
  if (problems.length > 0) {
    for (const problem of problems) io.err(`${problem.message}\n`);
    io.err('Ô sô, a cartilha tem lição torta, então o índice não sai.\n');
    return 1;
  }
  const index = buildLessonIndex(lessons);
  const expected: readonly (readonly [string, string])[] = [
    [targets.playgroundFile, renderPlaygroundIndex(index)],
    [targets.extensionFile, renderExtensionTerms(index)],
  ];
  if (targets.mode === WRITE_FLAG) {
    for (const [path, text] of expected) io.write(path, text);
    io.out(`Tá pronto, sô! Índice de ${String(index.lessonIds.length)} lição(ões) gravado.\n`);
    return 0;
  }
  const stale = expected.filter(([path, text]) => readOrEmpty(io, path) !== text).map(([path]) => path);
  if (stale.length === 0) return 0;
  io.err(`Ô sô, o índice das lições tá velho em:\n${stale.join('\n')}\nRoda: node apps/playground/scripts/build-lesson-index.ts --write\n`);
  return 1;
}

function modeOf(args: readonly string[]): LessonIndexMode | undefined {
  if (args.includes(WRITE_FLAG)) return WRITE_FLAG;
  return args.includes(CHECK_FLAG) ? CHECK_FLAG : undefined;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const appRoot = join(import.meta.dirname, '..');
  const mode = modeOf(process.argv.slice(2));
  if (mode === undefined) {
    process.stderr.write(`Ô sô, passa ${WRITE_FLAG} ou ${CHECK_FLAG}.\n`);
    process.exit(1);
  }
  const io: LessonIndexIo = {
    read: (path) => readFileSync(path, 'utf8'),
    write: (path, text) => {
      writeFileSync(path, text);
    },
    out: (text) => process.stdout.write(text),
    err: (text) => process.stderr.write(text),
  };
  process.exit(
    runBuildLessonIndex(
      {
        contentDir: join(appRoot, 'content', 'cartilha'),
        playgroundFile: join(appRoot, 'lib', 'cartilha', 'lesson-index.generated.ts'),
        extensionFile: join(appRoot, '..', '..', 'packages', 'vscode', 'src', 'language', 'lesson-terms.generated.ts'),
        mode,
      },
      io,
    ),
  );
}
