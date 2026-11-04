import { describe, expect, it } from 'vitest';
import { LESSON_BY_NAMESPACE, LESSON_BY_RECEIVER, STDLIB, lessonForStdlibEntry, lessonTitleOf } from '../src/index.ts';

describe('lição por receptor da biblioteca', () => {
  it('todo id da tabela existe nos títulos das lições', () => {
    const ids = [...Object.values(LESSON_BY_RECEIVER), ...LESSON_BY_NAMESPACE.values()].filter((id): id is string => id !== undefined);
    expect(ids.filter((id) => lessonTitleOf(id) === undefined)).toEqual([]);
  });

  it('cobre todos os receptores da biblioteca', () => {
    const receivers = new Set(STDLIB.map((entry) => entry.receiver));
    expect([...receivers].filter((receiver) => !Object.hasOwn(LESSON_BY_RECEIVER, receiver))).toEqual([]);
  });

  it.each([
    ['arruma', 'list', 'licao-06'],
    ['Coisa.chaves', 'namespace', 'licao-08'],
    ['trocar', 'text', 'licao-03'],
    ['Conta.sorteia_um', 'namespace', undefined],
  ])('%s (%s) aponta para %s', (name, receiver, lesson) => {
    const entry = STDLIB.find((item) => item.receiver === receiver && item.name === name);
    expect(entry).toBeDefined();
    if (entry !== undefined) expect(lessonForStdlibEntry(entry)).toBe(lesson);
  });

  it('textOrList vai para listas e os demais receptores ficam sem lição', () => {
    expect(LESSON_BY_RECEIVER.textOrList).toBe('licao-06');
    const lessonless = [LESSON_BY_RECEIVER.number, LESSON_BY_RECEIVER.date, LESSON_BY_RECEIVER.promise, LESSON_BY_RECEIVER.error, LESSON_BY_RECEIVER.global];
    expect(lessonless).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });
});
