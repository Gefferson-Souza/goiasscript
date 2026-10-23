import { parse as parseYaml } from 'yaml';
import {
  BLOCK_LANGUAGE, CODE_FENCE, DIAGNOSTIC_CODE_PATTERN, EXAMPLE_MODIFIER, EXPECTED_ERROR_MODIFIER, FRONTMATTER_FENCE, SOURCE_LINE_BREAK,
} from './lesson.constants.ts';
import { lessonProblem, validateFrontmatter } from './lesson-schema.ts';
import type { FrontmatterIssue, Lesson, LessonBlock, BlockMode, LessonProblem, ParseLessonResult, ReadStdin } from './lesson.types.ts';

interface BlockScan {
  readonly blocks: readonly LessonBlock[];
  readonly problems: readonly LessonProblem[];
}

interface Info {
  readonly mode: BlockMode;
  readonly expectedCode?: string;
}

function infoOf(tokens: readonly string[]): Info | string {
  if (tokens.length === 0) return { mode: 'static' };
  const [modifier, code] = tokens;
  if (tokens.length === 1 && modifier === EXAMPLE_MODIFIER) return { mode: 'editable' };
  if (tokens.length === 2 && modifier === EXPECTED_ERROR_MODIFIER && code !== undefined && DIAGNOSTIC_CODE_PATTERN.test(code)) {
    return { mode: 'expected-error', expectedCode: code };
  }
  return `o bloco "${tokens.join(' ')}" não é exemplo nem erro-esperado GSnnnn.`;
}

function blockFrom(file: string, lines: readonly string[], index: number, end: number): BlockScan {
  const tokens = (lines[index] ?? '').slice(CODE_FENCE.length).trim().split(/\s+/u).filter((token) => token !== '');
  if (tokens[0] !== BLOCK_LANGUAGE) return { blocks: [], problems: [] };
  const info = infoOf(tokens.slice(1));
  if (typeof info === 'string') return { blocks: [], problems: [lessonProblem(file, index + 1, info)] };
  return { blocks: [{ ...info, code: lines.slice(index + 1, end).join('\n'), line: index + 1 }], problems: [] };
}

function scanBlocks(file: string, lines: readonly string[], index: number): BlockScan {
  const opening = lines.findIndex((line, position) => position >= index && line.startsWith(CODE_FENCE));
  if (opening === -1) return { blocks: [], problems: [] };
  const closing = lines.findIndex((line, position) => position > opening && line.trim() === CODE_FENCE);
  if (closing === -1) return { blocks: [], problems: [lessonProblem(file, opening + 1, 'esse bloco de código abriu e não fechou.')] };
  const here = blockFrom(file, lines, opening, closing);
  const rest = scanBlocks(file, lines, closing + 1);
  return { blocks: [...here.blocks, ...rest.blocks], problems: [...here.problems, ...rest.problems] };
}

function locateKey(frontLines: readonly string[], key: string): number {
  const found = frontLines.findIndex((line) => new RegExp(`^\\s*${key}\\s*:`, 'u').test(line));
  return found === -1 ? 1 : found + 2;
}

function issueProblems(file: string, frontLines: readonly string[], issues: readonly FrontmatterIssue[]): readonly LessonProblem[] {
  return issues.map((issue) => lessonProblem(file, issue.key === '' ? 1 : locateKey(frontLines, issue.key), issue.text));
}

function exampleProblems(file: string, blocks: readonly LessonBlock[]): readonly LessonProblem[] {
  const examples = blocks.filter((block) => block.mode === 'editable');
  if (examples.length === 0) return [lessonProblem(file, 1, 'lição sem bloco exemplo: precisa de um ```goiasscript exemplo.')];
  return examples.slice(1).map((block) => lessonProblem(file, block.line, 'tem mais de um bloco exemplo, só pode ter um.'));
}

function readFront(file: string, lines: readonly string[]): { readonly front: readonly string[]; readonly bodyStart: number } | LessonProblem {
  if (lines[0]?.trim() !== FRONTMATTER_FENCE) return lessonProblem(file, 1, 'a lição precisa começar com o cabeçalho entre ---.');
  const close = lines.findIndex((line, position) => position > 0 && line.trim() === FRONTMATTER_FENCE);
  if (close === -1) return lessonProblem(file, 1, 'o cabeçalho da lição abriu e não fechou com ---.');
  return { front: lines.slice(1, close), bodyStart: close + 1 };
}

function parseData(file: string, front: readonly string[]): { readonly data: unknown } | LessonProblem {
  try {
    return { data: parseYaml(front.join('\n')) as unknown };
  } catch {
    return lessonProblem(file, 1, 'o cabeçalho da lição não é um YAML que se entenda.');
  }
}

function splitAnswers(text: string): readonly string[] {
  const lines = text.split(SOURCE_LINE_BREAK);
  return lines.at(-1) === '' ? lines.slice(0, -1) : lines;
}

function readStdinSafe(file: string, front: readonly string[], stdinFile: string | undefined, readStdin: ReadStdin): readonly string[] | undefined | LessonProblem {
  if (stdinFile === undefined) return undefined;
  try {
    return splitAnswers(readStdin(stdinFile));
  } catch {
    return lessonProblem(file, locateKey(front, 'stdinFile'), `não consegui abrir o arquivo de entrada "${stdinFile}".`);
  }
}

const isProblem = (value: unknown): value is LessonProblem => typeof value === 'object' && value !== null && 'message' in value;

export function parseLesson(file: string, raw: string, readStdin: ReadStdin): ParseLessonResult {
  const lines = raw.split(SOURCE_LINE_BREAK);
  const head = readFront(file, lines);
  if ('message' in head) return { ok: false, problems: [head] };
  const parsed = parseData(file, head.front);
  if ('message' in parsed) return { ok: false, problems: [parsed] };
  const checked = validateFrontmatter(parsed.data);
  const scan = scanBlocks(file, lines, head.bodyStart);
  if (!checked.ok) return { ok: false, problems: [...issueProblems(file, head.front, checked.issues), ...scan.problems] };
  const { exercise, ...meta } = checked.value;
  const stdin = readStdinSafe(file, head.front, exercise.stdinFile, readStdin);
  const example = scan.blocks.find((block) => block.mode === 'editable');
  const problems = [...scan.problems, ...exampleProblems(file, scan.blocks), ...(isProblem(stdin) ? [stdin] : [])];
  if (problems.length > 0 || isProblem(stdin) || example === undefined) return { ok: false, problems };
  const lesson: Lesson = {
    ...meta,
    file,
    exercise: {
      prompt: exercise.prompt,
      starter: exercise.starter,
      solution: exercise.solution,
      expectedStdout: exercise.expectedStdout,
      ...(stdin === undefined ? {} : { stdin }),
    },
    blocks: scan.blocks,
    example,
    bodyMarkdown: lines.slice(head.bodyStart).join('\n'),
    solutionLine: locateKey(head.front, 'solution'),
  };
  return { ok: true, lesson };
}
