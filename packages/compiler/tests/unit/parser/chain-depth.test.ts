import { LIMITS } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import type { Program } from '../../../src/ast/ast.types.ts';
import { walk } from '../../../src/ast/walk.ts';
import { codes, parseText } from '../../support/parse.ts';

const HUGE = 100_000;
const MAX = LIMITS.maxNestingDepth;
const MAX_VISITED_NODES = MAX * 5;

const CHAINS: readonly (readonly [string, (count: number) => string])[] = [
  ['cadeia à esquerda de operadores', (count) => `1${' mais 1'.repeat(count)}`],
  ['cadeia de membros', (count) => `a${'.a'.repeat(count)}`],
  ['cadeia de chamadas', (count) => `f${'()'.repeat(count)}`],
  ['cadeia de índices', (count) => `a${'[0]'.repeat(count)}`],
];
const RIGHT_NESTED: readonly (readonly [string, (count: number) => string])[] = [
  ['atribuições à direita', (count) => `${'a é '.repeat(count)}a`],
  ['negações empilhadas', (count) => `${'menos '.repeat(count)}1`],
];

const visitedNodes = (program: Program): number => {
  let visited = 0;
  walk(program, () => {
    visited += 1;
  });
  return visited;
};

describe('parser: profundidade efetiva das cadeias (§5.4)', () => {
  it.each(CHAINS)('%s: aceita até o limite sem diagnóstico e recusa um nível a mais com um GS0522', (_name, build) => {
    expect(codes(parseText(build(MAX - 1)))).toEqual([]);
    expect(codes(parseText(build(MAX)))).toEqual([]);
    expect(codes(parseText(build(MAX + 1)))).toEqual(['GS0522']);
  });
  it.each(CHAINS)('%s: 100 mil níveis dão exatamente um GS0522, sem lançar, e o walk não estoura', (_name, build) => {
    const result = parseText(build(HUGE), 'repl');
    expect(codes(result)).toEqual(['GS0522']);
    expect(result.incomplete).toBe(false);
    expect(visitedNodes(result.program)).toBeLessThan(MAX_VISITED_NODES);
  });
  it.each(RIGHT_NESTED)('%s: aceita até o limite e, com 100 mil, dá um GS0522 e o walk não estoura', (_name, build) => {
    expect(codes(parseText(build(MAX)))).toEqual([]);
    const result = parseText(build(HUGE));
    expect(codes(result).filter((code) => code === 'GS0522')).toHaveLength(1);
    expect(visitedNodes(result.program)).toBeLessThan(MAX_VISITED_NODES);
  });
  it('soma a cadeia de chamadas com a de operadores sobre o mesmo nó', () => {
    const call = (operators: number) => `f${'()'.repeat(MAX - 50)}${' mais 1'.repeat(operators)}`;
    expect(codes(parseText(call(50)))).toEqual([]);
    expect(codes(parseText(call(51)))).toEqual(['GS0522']);
  });
  it('conta o aninhamento de fora junto com a cadeia de dentro', () => {
    const inner = `1${' mais 1'.repeat(MAX - 10)}`;
    expect(codes(parseText(`(${inner})`))).toEqual([]);
    expect(codes(parseText(`${'('.repeat(11)}${inner}${')'.repeat(11)}`))).toEqual(['GS0522']);
  });
  it('troca só a subárvore excedente por ErrorNode e segue parseando o resto do arquivo', () => {
    const result = parseText(`uai a é 1${' mais 1'.repeat(MAX + 1)}\nuai b é 2\nprosa(b)`);
    expect(codes(result)).toEqual(['GS0522']);
    expect(result.program.body.map((node) => node.type)).toEqual(['VariableDeclaration', 'VariableDeclaration', 'ExpressionStatement']);
  });
});
