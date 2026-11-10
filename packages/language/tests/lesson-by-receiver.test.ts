import { describe, expect, it } from 'vitest';
import { LESSON_BY_NAMESPACE, LESSON_BY_RECEIVER, STDLIB, lessonForStdlibEntry, lessonTitleOf } from '../src/index.ts';

const NAMESPACE_SEPARATOR = '.';
// Namespace novo na biblioteca obriga a decidir a lição: entra em LESSON_BY_NAMESPACE ou aqui (decisão do dono, 2026-11-03).
const LESSONLESS_NAMESPACES: ReadonlySet<string> = new Set(['Conta', 'Data', 'Promessa']);

describe('lição por receptor da biblioteca', () => {
  it('todo id da tabela existe nos títulos das lições', () => {
    const ids = [...Object.values(LESSON_BY_RECEIVER), ...LESSON_BY_NAMESPACE.values()].filter((id): id is string => id !== undefined);
    expect(ids.filter((id) => lessonTitleOf(id) === undefined)).toEqual([]);
  });

  it('todo prefixo dos membros de namespace está decidido e todo prefixo da tabela existe na biblioteca', () => {
    const prefixes = new Set(STDLIB.filter((entry) => entry.receiver === 'namespace').map((entry) => entry.name.split(NAMESPACE_SEPARATOR)[0]));
    expect([...prefixes].filter((prefix) => prefix === undefined || (!LESSON_BY_NAMESPACE.has(prefix) && !LESSONLESS_NAMESPACES.has(prefix)))).toEqual([]);
    expect([...LESSON_BY_NAMESPACE.keys(), ...LESSONLESS_NAMESPACES].filter((prefix) => !prefixes.has(prefix))).toEqual([]);
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
    const lessonless = [LESSON_BY_RECEIVER.object, LESSON_BY_RECEIVER.number, LESSON_BY_RECEIVER.date, LESSON_BY_RECEIVER.promise, LESSON_BY_RECEIVER.error, LESSON_BY_RECEIVER.global];
    expect(lessonless).toEqual([undefined, undefined, undefined, undefined, undefined, undefined]);
  });
});
