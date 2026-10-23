import { EXERCISE_KEYS, FRONTMATTER_KEYS, LESSON_ID_FORMAT, STDIN_FILE_PATTERN } from './lesson.constants.ts';
import type { FrontmatterIssue, FrontmatterResult, LessonFrontmatter, LessonProblem } from './lesson.types.ts';

type PlainRecord = Readonly<Record<string, unknown>>;

const isRecord = (value: unknown): value is PlainRecord => typeof value === 'object' && value !== null && !Array.isArray(value);
const isFilled = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

export function lessonProblem(file: string, line: number, text: string): LessonProblem {
  return { file, line, message: `Ô sô, ${file}:${String(line)} — ${text}` };
}

function unknownKeys(record: PlainRecord, allowed: readonly string[]): readonly FrontmatterIssue[] {
  return Object.keys(record)
    .filter((key) => !allowed.includes(key))
    .map((key) => ({ key, text: `a chave "${key}" não existe no cabeçalho da lição.` }));
}

function validateTerms(value: unknown): readonly FrontmatterIssue[] {
  const valid = Array.isArray(value) && value.length > 0 && value.every(isFilled);
  return valid ? [] : [{ key: 'terms', text: 'os "terms" precisam ser uma lista de palavras, sem nenhuma vazia.' }];
}

function validateHeader(record: PlainRecord): readonly FrontmatterIssue[] {
  const order = record['order'];
  const idIssue: readonly FrontmatterIssue[] =
    typeof record['id'] === 'string' && LESSON_ID_FORMAT.test(record['id']) ? [] : [{ key: 'id', text: 'o "id" precisa ser do jeito licao-NN, com dois dígitos.' }];
  const orderIssue: readonly FrontmatterIssue[] =
    typeof order === 'number' && Number.isInteger(order) && order >= 1 ? [] : [{ key: 'order', text: 'o "order" precisa ser um número inteiro a partir de 1.' }];
  return [...idIssue, ...orderIssue, ...missingText(record, ['title', 'summary'], 'da lição')];
}

function missingText(record: PlainRecord, keys: readonly string[], where: string): readonly FrontmatterIssue[] {
  return keys.filter((key) => !isFilled(record[key])).map((key) => ({ key, text: `falta o "${key}" ${where}.` }));
}

function validateStdinFile(value: unknown): readonly FrontmatterIssue[] {
  if (value === undefined) return [];
  const safe = typeof value === 'string' && STDIN_FILE_PATTERN.test(value);
  return safe ? [] : [{ key: 'stdinFile', text: 'o "stdinFile" precisa ficar dentro da pasta stdin, do jeito stdin/nome.txt.' }];
}

function validateExercise(value: unknown): readonly FrontmatterIssue[] {
  if (!isRecord(value)) return [{ key: 'exercise', text: 'falta o "exercise" da lição.' }];
  const starter: readonly FrontmatterIssue[] = typeof value['starter'] === 'string' ? [] : [{ key: 'starter', text: 'falta o "starter" no exercício.' }];
  return [
    ...unknownKeys(value, EXERCISE_KEYS),
    ...missingText(value, ['prompt', 'solution', 'expectedStdout'], 'no exercício'),
    ...starter,
    ...validateStdinFile(value['stdinFile']),
  ];
}

function toFrontmatter(record: PlainRecord, exercise: PlainRecord): LessonFrontmatter {
  const stdinFile = exercise['stdinFile'];
  return {
    id: record['id'] as string,
    order: record['order'] as number,
    title: record['title'] as string,
    summary: record['summary'] as string,
    terms: record['terms'] as readonly string[],
    exercise: {
      prompt: exercise['prompt'] as string,
      starter: exercise['starter'] as string,
      solution: exercise['solution'] as string,
      expectedStdout: exercise['expectedStdout'] as string,
      ...(typeof stdinFile === 'string' ? { stdinFile } : {}),
    },
  };
}

export function validateFrontmatter(data: unknown): FrontmatterResult {
  if (!isRecord(data)) return { ok: false, issues: [{ key: '', text: 'o cabeçalho da lição precisa ser um conjunto de chaves.' }] };
  const issues = [...unknownKeys(data, FRONTMATTER_KEYS), ...validateHeader(data), ...validateTerms(data['terms']), ...validateExercise(data['exercise'])];
  if (issues.length > 0 || !isRecord(data['exercise'])) return { ok: false, issues };
  return { ok: true, value: toFrontmatter(data, data['exercise']) };
}
