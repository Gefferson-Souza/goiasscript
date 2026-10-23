import { lookupKeyword, lookupStdlibGlobal, lookupStdlibMember } from '@goiasscript/language';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LESSON_FILE_PATTERN } from './lesson.constants.ts';
import { lessonProblem } from './lesson-schema.ts';
import type { Lesson, LessonProblem, LoadLessonsResult, ParseLessonResult } from './lesson.types.ts';
import { parseLesson } from './parse-lesson.ts';

interface TermEntry {
  readonly lesson: Lesson;
  readonly term: string;
  readonly key: string;
}

const termExists = (name: string): boolean => lookupKeyword(name) !== undefined || lookupStdlibGlobal(name) !== undefined || lookupStdlibMember(name).length > 0;

function listFileNames(dir: string): readonly string[] {
  try {
    return readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

function idProblems(lessons: readonly Lesson[]): readonly LessonProblem[] {
  return lessons.flatMap((lesson, index) => {
    const earlier = lessons.slice(0, index).find((other) => other.id === lesson.id);
    const repeated = earlier === undefined ? [] : [lessonProblem(lesson.file, 1, `o id "${lesson.id}" está repetido, já é da ${earlier.file}.`)];
    const mismatch = `${lesson.id}.md` === lesson.file ? [] : [lessonProblem(lesson.file, 1, `o id "${lesson.id}" precisa ser igual ao nome do arquivo.`)];
    return [...repeated, ...mismatch];
  });
}

function termProblems(lessons: readonly Lesson[]): readonly LessonProblem[] {
  const entries: readonly TermEntry[] = lessons.flatMap((lesson) => lesson.terms.map((term) => ({ lesson, term, key: term.normalize('NFC') })));
  return entries.flatMap((entry, index) => {
    const earlier = entries.slice(0, index).find((other) => other.key === entry.key);
    if (earlier !== undefined) {
      return [lessonProblem(entry.lesson.file, 1, `o termo "${entry.term}" já é da ${earlier.lesson.file}, cada palavra fica numa lição só.`)];
    }
    return termExists(entry.key) ? [] : [lessonProblem(entry.lesson.file, 1, `o termo "${entry.term}" não existe na tabela da linguagem.`)];
  });
}

function orderProblems(lessons: readonly Lesson[]): readonly LessonProblem[] {
  const sorted = [...lessons].sort((a, b) => a.order - b.order);
  return sorted.flatMap((lesson, index) =>
    lesson.order === index + 1
      ? []
      : [lessonProblem(lesson.file, 1, `a ordem ${String(lesson.order)} quebrou a sequência: aqui devia ser a ${String(index + 1)}, sem buraco nem repetição.`)],
  );
}

function readOne(dir: string, name: string): ParseLessonResult {
  if (!LESSON_FILE_PATTERN.test(name)) {
    return { ok: false, problems: [lessonProblem(name, 1, 'o nome da lição precisa ser licao-NN.md, com dois dígitos.')] };
  }
  const readStdin = (stdinFile: string): string => readFileSync(join(dir, stdinFile), 'utf8');
  return parseLesson(name, readFileSync(join(dir, name), 'utf8'), readStdin);
}

export function loadLessons(dir: string): LoadLessonsResult {
  const results = listFileNames(dir).map((name) => readOne(dir, name));
  const lessons = results.flatMap((result) => (result.ok ? [result.lesson] : []));
  const parseProblems = results.flatMap((result) => (result.ok ? [] : result.problems));
  return { lessons, problems: [...parseProblems, ...idProblems(lessons), ...termProblems(lessons), ...orderProblems(lessons)] };
}
