import { describe, expect, it } from 'vitest';
import type { AstNode } from '../../../src/ast/ast.types.ts';
import { forEachChild } from '../../../src/ast/walk.ts';
import { analyzeSource } from '../../support/analyze.ts';

function memberKinds(text: string): readonly string[] {
  const { analysis, parsed } = analyzeSource(text);
  const kinds: string[] = [];
  const walk = (node: AstNode): void => {
    if (node.type === 'MemberExpression' && !node.computed && node.property.type === 'Identifier' && node.property.name === 'mapear') {
      kinds.push(analysis.resolutionOf(node).kind);
    }
    forEachChild(node, walk);
  };
  walk(parsed.program);
  return kinds;
}

describe('resolução de membro com nome também declarado pelo aluno', () => {
  it('chamada de método resolve para a biblioteca', () => {
    expect(memberKinds('uai o é { mapear: 1 }\nuai l é [1]\nl.mapear(n => n)')).toEqual(['library']);
  });
  it('leitura sem chamada resolve para o programa', () => {
    expect(memberKinds('uai o é { mapear: 1 }\nprosa(o.mapear)')).toEqual(['program']);
  });
  it('sem declaração do aluno, a leitura continua na biblioteca', () => {
    expect(memberKinds('uai l é [1]\nl.mapear(n => n)')).toEqual(['library']);
  });
});
