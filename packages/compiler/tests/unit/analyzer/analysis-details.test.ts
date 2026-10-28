import { describe, expect, it } from 'vitest';
import type { AstNode } from '../../../src/ast/ast.types.ts';
import { forEachChild } from '../../../src/ast/walk.ts';
import { analyzeSource } from '../../support/analyze.ts';

function argsOf(text: string, code: string): Readonly<Record<string, unknown>> | undefined {
  return analyzeSource(text).analysis.diagnostics.find((item) => item.code === code)?.args;
}

describe('detalhes da análise', () => {
  it('nome que esconde global da biblioteca e nome repetido trazem o nome no aviso', () => {
    expect(argsOf('uai Data é 1', 'GS0804')).toStrictEqual({ name: 'Data' });
    expect(argsOf('uai a é 1\nuai a é 2', 'GS0304')).toStrictEqual({ name: 'a' });
  });
  it('nome de propriedade, que ninguém resolveu, aparece como não resolvido', () => {
    const { analysis, parsed } = analyzeSource('uai o é { campo: 1 }\nprosa(o.campo)');
    const kinds: string[] = [];
    const visit = (node: AstNode): void => {
      if (node.type === 'MemberExpression' && node.property.type === 'Identifier') kinds.push(analysis.resolutionOf(node.property).kind);
      forEachChild(node, visit);
    };
    visit(parsed.program);
    expect(kinds).toEqual(['unresolved']);
  });
  it('vixe dentro do laço conta como saída: sem aviso de laço sem fim', () => {
    expect(analyzeSource('enquanto_tiver (certeza) { vixe("fim") }').codes).toEqual([]);
  });
  it('atribuição a membro calculado por variável não entra no censo de membros', () => {
    expect([...analyzeSource('uai i é "a"\nuai o é {}\no[i] é 1').analysis.declaredMembers]).toEqual([]);
  });
  it('estático de outro namespace não é sugerido para Conta', () => {
    expect(argsOf('prosa(Conta.tem)', 'GS0305')).toStrictEqual({ name: 'tem' });
    expect(argsOf('prosa(Coisa.maior)', 'GS0305')).toBeDefined();
  });
  it('palavra da linguagem usada como nome fica sem resolução, para o aviso GS0303 não ser repetido', () => {
    const { analysis, parsed } = analyzeSource('uai mais é 1\nprosa(mais)');
    const kinds: string[] = [];
    const visit = (node: AstNode): void => {
      if (node.type === 'Identifier' && node.name === 'mais') kinds.push(analysis.resolutionOf(node).kind);
      forEachChild(node, visit);
    };
    visit(parsed.program);
    expect(kinds).toEqual(['program', 'unresolved']);
  });
  it('sugestão de membro vem só de membros de instância da biblioteca', () => {
    expect(argsOf('uai o é { a: 1 }\nprosa(o.gritnado)', 'GS0305')).toStrictEqual({ name: 'gritnado', suggestion: 'gritando' });
    expect(argsOf('uai o é { a: 1 }\nprosa(o.pross)', 'GS0305')).toStrictEqual({ name: 'pross' });
    expect(argsOf('uai o é { a: 1 }\nprosa(o.Conta)', 'GS0305')).toStrictEqual({ name: 'Conta' });
  });
  it('sugestão de nome vem só de globais da biblioteca, não de métodos', () => {
    expect(argsOf('prosa(gritnado)', 'GS0301')).toStrictEqual({ name: 'gritnado' });
  });
});
