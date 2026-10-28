import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('membros da biblioteca', () => {
  it('membro estático em linha posterior não herda as quebras das linhas anteriores', () => {
    expect(emit('prosa(1)\nprosa(Conta.PI)').code).toBe('console.log(1);\nconsole.log(Math.PI);');
  });
  it('membro estático quebrado em duas linhas preserva a quebra', () => {
    expect(emit('prosa(Conta\n.PI)').code).toBe('console.log(Math.PI\n);');
  });
  it('propriedade com ajudante em linha posterior não herda as quebras anteriores', () => {
    const { code, helpers } = emit('prosa(1)\ntenta_aí { }\nse_der_ruim (e) {\n  prosa(e.mensagem)\n}');
    expect(code.split('\n').slice(0, 5)).toEqual(['console.log(1);', 'try { }', 'catch (e) {', '  console.log($gs_mensagem(e));', '}']);
    expect(helpers).toEqual(['mensagem']);
  });
  it('membro desconhecido de objeto da biblioteca só troca o nome do objeto', () => {
    expect(emit('prosa(Conta.inexistente)').code).toBe('console.log(Math.inexistente);');
  });
  it('acesso computado a objeto da biblioteca só troca o nome do objeto', () => {
    expect(emit('prosa(Conta["PI"])').code).toBe('console.log(Math["PI"]);');
  });
  it('no repl a biblioteca é reescrita, mas a pergunta fica com o ambiente', () => {
    expect(emit('prosa(Conta.PI)', 'repl').code).toBe("'use strict'; console.log(Math.PI);");
    expect(emit('uai t é "ab"\nprosa(t.o_tanto)', 'repl').code.split('\n')[1]).toBe('console.log(t.length);');
    const { code, helpers } = emit('pergunta("x")', 'repl');
    expect(code).toContain('await pergunta("x")');
    expect(helpers).toEqual([]);
  });
});
