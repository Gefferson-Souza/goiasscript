import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadLessons } from '../../lib/cartilha/load-lessons.ts';
import { lessonSource } from '../support/lesson-source.ts';
import type { LessonSourceOptions } from '../support/lesson-source.types.ts';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function seed(files: Readonly<Record<string, LessonSourceOptions>>, stdin: Readonly<Record<string, string>> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), 'cartilha-'));
  roots.push(dir);
  for (const [name, options] of Object.entries(files)) writeFileSync(join(dir, name), lessonSource(options));
  mkdirSync(join(dir, 'stdin'));
  for (const [name, text] of Object.entries(stdin)) writeFileSync(join(dir, 'stdin', name), text);
  return dir;
}

const messages = (dir: string): string => loadLessons(dir).problems.map((problem) => problem.message).join('\n');

describe('loadLessons', () => {
  it('carrega lições válidas em ordem e lê o stdin do arquivo', () => {
    const dir = seed(
      { 'licao-02.md': { id: 'licao-02', order: 2, terms: ['uai'], stdinFile: 'stdin/licao-02.txt' }, 'licao-01.md': {} },
      { 'licao-02.txt': '10.50\n' },
    );
    const { lessons, problems } = loadLessons(dir);
    expect(problems).toEqual([]);
    expect(lessons.map((lesson) => lesson.id)).toEqual(['licao-01', 'licao-02']);
    expect(lessons[1]?.exercise.stdin).toEqual(['10.50']);
  });

  it('aceita pasta vazia ou ausente', () => {
    expect(loadLessons(seed({}))).toEqual({ lessons: [], problems: [] });
    expect(loadLessons(join(tmpdir(), 'cartilha-que-nao-existe-xyz'))).toEqual({ lessons: [], problems: [] });
  });

  it('recusa id repetido entre lições e id diferente do nome do arquivo', () => {
    const dir = seed({ 'licao-01.md': {}, 'licao-02.md': { id: 'licao-01', order: 2, terms: ['uai'] } });
    expect(messages(dir)).toContain('repetido');
    expect(messages(dir)).toContain('licao-02.md');
  });

  it('recusa ordem com buraco', () => {
    const dir = seed({ 'licao-01.md': {}, 'licao-03.md': { id: 'licao-03', order: 3, terms: ['uai'] } });
    expect(messages(dir)).toContain('ordem');
  });

  it('recusa termo que não está na tabela da linguagem', () => {
    const dir = seed({ 'licao-01.md': { terms: ['prosa', 'trem_que_nao_existe'] } });
    expect(messages(dir)).toContain('trem_que_nao_existe');
  });

  it('recusa termo repetido em duas lições', () => {
    const dir = seed({ 'licao-01.md': {}, 'licao-02.md': { id: 'licao-02', order: 2, terms: ['prosa'] } });
    expect(messages(dir)).toContain('prosa');
    expect(messages(dir)).toContain('licao-01');
  });

  it('aceita palavra-chave, global e membro da biblioteca como termo', () => {
    const dir = seed({ 'licao-01.md': { terms: ['uai', 'prosa', 'mapear'] } });
    expect(loadLessons(dir).problems).toEqual([]);
  });

  it('recusa arquivo com nome fora do padrão', () => {
    const dir = seed({ 'lição.md': {} });
    expect(messages(dir)).toContain('lição.md');
  });
});
