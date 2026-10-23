import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ANSWER_FILE_PATTERN,
  ANSWER_KEYS,
  DIAGNOSTIC_CODE_FORMAT,
  DIR_FLAG,
  EMAIL_PATTERN,
  KEEP_FILE,
  LEARNER_ID_FORMAT,
  LESSON_ID_FORMAT,
  LESSON_KEYS,
  MAX_COMMENT_LENGTH,
  MESSAGE_KEYS,
  PHONE_PATTERN,
  PILOT_ORIGINS,
  REQUIRED_LEARNERS,
  REQUIRED_LESSONS,
  TOP_LIMIT,
} from './summarize-pilot.constants.ts';
import type {
  ParsePilotAnswerResult,
  PilotAnswer,
  PilotOrigin,
  PilotSummary,
  RankedEntry,
  SummarizePilotIo,
  SummarizePilotOptions,
} from './summarize-pilot.types.ts';

type Fail = { readonly ok: false; readonly reason: string };
const fail = (reason: string): Fail => ({ ok: false, reason });

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unknownKey(record: Readonly<Record<string, unknown>>, allowed: readonly string[]): string | undefined {
  return Object.keys(record).find((key) => !allowed.includes(key));
}

function commentProblem(value: unknown): string | null {
  if (typeof value !== 'string') return 'o comentário precisa ser texto';
  if (value.length > MAX_COMMENT_LENGTH) return `o comentário passa de ${String(MAX_COMMENT_LENGTH)} caracteres`;
  if (EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value)) return 'o comentário traz e-mail ou telefone, e o retorno é anônimo';
  return null;
}

function parseEntry<T>(item: unknown, keys: readonly string[], field: string, build: (item: Readonly<Record<string, unknown>>) => T | string): T | string {
  if (!isRecord(item)) return `${field} tem item que não é objeto`;
  const extra = unknownKey(item, keys);
  if (extra !== undefined) return `${field} tem o campo desconhecido "${extra}"`;
  const problem = commentProblem(item.comment);
  if (problem !== null) return `${field}: ${problem}`;
  const built = build(item);
  return typeof built === 'string' ? `${field}: ${built}` : built;
}

function parseEntries<T>(raw: unknown, keys: readonly string[], field: string, build: (item: Readonly<Record<string, unknown>>) => T | string): readonly T[] | string {
  if (!Array.isArray(raw)) return `${field} precisa ser uma lista`;
  const parsed = (raw as readonly unknown[]).map((item) => parseEntry(item, keys, field, build));
  const problem = parsed.find((entry): entry is string => typeof entry === 'string');
  return problem ?? (parsed as readonly T[]);
}

export function parsePilotAnswer(raw: unknown): ParsePilotAnswerResult {
  if (!isRecord(raw)) return fail('a resposta precisa ser um objeto');
  const extra = unknownKey(raw, ANSWER_KEYS);
  if (extra !== undefined) return fail(`campo desconhecido "${extra}"`);
  const { learnerId, origin, lessonsCompleted } = raw;
  if (typeof learnerId !== 'string' || !LEARNER_ID_FORMAT.test(learnerId)) return fail('learnerId precisa ser de A1 a A9');
  if (typeof origin !== 'string' || !PILOT_ORIGINS.includes(origin)) return fail('origin precisa ser "goias" ou "fora"');
  if (!Array.isArray(lessonsCompleted) || !lessonsCompleted.every((id) => typeof id === 'string' && LESSON_ID_FORMAT.test(id))) {
    return fail('lessonsCompleted precisa ser uma lista de ids licao-NN');
  }
  const messages = parseEntries(raw.confusingMessages, MESSAGE_KEYS, 'confusingMessages', (item) =>
    typeof item.code === 'string' && DIAGNOSTIC_CODE_FORMAT.test(item.code) ? { code: item.code, comment: item.comment as string } : 'code precisa ser GSnnnn',
  );
  if (typeof messages === 'string') return fail(messages);
  const lessons = parseEntries(raw.confusingLessons, LESSON_KEYS, 'confusingLessons', (item) =>
    typeof item.lessonId === 'string' && LESSON_ID_FORMAT.test(item.lessonId) ? { lessonId: item.lessonId, comment: item.comment as string } : 'lessonId precisa ser licao-NN',
  );
  if (typeof lessons === 'string') return fail(lessons);
  const answer: PilotAnswer = { learnerId, origin: origin as PilotOrigin, lessonsCompleted: lessonsCompleted as readonly string[], confusingMessages: messages, confusingLessons: lessons };
  return { ok: true, answer };
}

function rank(keys: readonly string[]): readonly RankedEntry[] {
  const counts = keys.reduce<Readonly<Record<string, number>>>((acc, key) => ({ ...acc, [key]: (acc[key] ?? 0) + 1 }), {});
  return Object.entries(counts)
    .map(([key, count]) => ({ key, count }))
    .toSorted((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, TOP_LIMIT);
}

export function summarizePilot(answers: readonly PilotAnswer[]): PilotSummary {
  const completed = answers.filter((answer) => REQUIRED_LESSONS.every((id) => answer.lessonsCompleted.includes(id))).length;
  return {
    learners: answers.length,
    completedLessons1to5: completed,
    s8Met: completed >= REQUIRED_LEARNERS,
    topCodes: rank(answers.flatMap((answer) => answer.confusingMessages.map((message) => message.code))),
    topLessons: rank(answers.flatMap((answer) => answer.confusingLessons.map((lesson) => lesson.lessonId))),
  };
}

function formatRanking(title: string, entries: readonly RankedEntry[]): string {
  if (entries.length === 0) return `${title}: ninguém reclamou.\n`;
  return `${title}:\n${entries.map((entry) => `  ${entry.key} (${String(entry.count)}x)\n`).join('')}`;
}

export function formatPilotSummary(summary: PilotSummary): string {
  const progress = `${String(summary.completedLessons1to5)}/${String(REQUIRED_LEARNERS)}`;
  if (summary.learners === 0) return `Piloto da cartilha: ${progress} — pendente do dono\nNinguém mandou retorno ainda, sô.\n`;
  const verdict = summary.s8Met ? 'Deu bom, sô! O piloto bateu a meta.' : 'Ainda falta gente concluir as lições 1 a 5, sô.';
  return [
    `Piloto da cartilha: ${progress} aprendizes com as lições 1 a 5 concluídas (${String(summary.learners)} respostas)`,
    verdict,
    formatRanking('Mensagens que mais confundiram', summary.topCodes),
    formatRanking('Lições que mais confundiram', summary.topLessons),
  ].join('\n');
}

type FileOutcome = { readonly file: string; readonly answer?: PilotAnswer; readonly problem?: string };

function readAnswerFile(dir: string, file: string): FileOutcome {
  try {
    const parsed = parsePilotAnswer(JSON.parse(readFileSync(join(dir, file), 'utf8')) as unknown);
    return parsed.ok ? { file, answer: parsed.answer } : { file, problem: `${file}: ${parsed.reason}` };
  } catch {
    return { file, problem: `${file}: não é um JSON válido` };
  }
}

function duplicateProblems(outcomes: readonly FileOutcome[]): readonly string[] {
  return outcomes.flatMap((outcome, index) => {
    const id = outcome.answer?.learnerId;
    const repeated = id !== undefined && outcomes.slice(0, index).some((earlier) => earlier.answer?.learnerId === id);
    return repeated ? [`${outcome.file}: o aprendiz ${id} aparece mais de uma vez`] : [];
  });
}

function loadAnswers(dir: string): { readonly answers: readonly PilotAnswer[]; readonly problems: readonly string[] } {
  const names = existsSync(dir) ? readdirSync(dir).filter((name) => name !== KEEP_FILE).toSorted() : [];
  const strays = names.filter((name) => !ANSWER_FILE_PATTERN.test(name)).map((name) => `${name}: nome fora do padrão AN.json (A1 a A9)`);
  const outcomes = names.filter((name) => ANSWER_FILE_PATTERN.test(name)).map((file) => readAnswerFile(dir, file));
  return {
    answers: outcomes.flatMap((outcome) => (outcome.answer === undefined ? [] : [outcome.answer])),
    problems: [...strays, ...outcomes.flatMap((outcome) => (outcome.problem === undefined ? [] : [outcome.problem])), ...duplicateProblems(outcomes)],
  };
}

export function runSummarizePilot(options: SummarizePilotOptions, io: SummarizePilotIo): number {
  const { answers, problems } = loadAnswers(options.dir);
  if (problems.length > 0) {
    problems.forEach((problem) => {
      io.err(`${problem}\n`);
    });
    io.err(`Ô sô, ${String(problems.length)} resposta(s) do piloto tá(ão) torta(s). Arruma e tenta de novo.\n`);
    return 1;
  }
  io.out(formatPilotSummary(summarizePilot(answers)));
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flagAt = args.indexOf(DIR_FLAG);
  const dir = flagAt === -1 ? join(import.meta.dirname, '..', '..', '..', 'docs', 'piloto', 'respostas') : (args[flagAt + 1] ?? '');
  process.exit(runSummarizePilot({ dir }, { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) }));
}
