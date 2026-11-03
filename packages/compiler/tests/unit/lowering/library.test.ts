import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

const firstLine = (source: string): string | undefined => emit(source).code.split('\n')[0];

describe('membros da biblioteca', () => {
  it('membro estático em linha posterior não herda as quebras das linhas anteriores', () => {
    expect(emit('prosa(1)\nprosa(Conta.PI)').code).toBe('console.log(1);\nconsole.log(Math.PI);');
  });
  it('membro estático quebrado em duas linhas preserva a quebra', () => {
    expect(emit('prosa(Conta\n.PI)').code).toBe('console.log(Math.PI\n);');
  });
  it('propriedade com ajudante em linha posterior não herda as quebras anteriores', () => {
    const { code, helpers } = emit(
      'prosa(1)\ntenta_aí { }\nse_der_ruim (e) {\n  prosa(e.mensagem)\n}'
    );
    expect(code.split('\n').slice(0, 5)).toEqual([
      'console.log(1);',
      'try { }',
      'catch (e) {',
      '  console.log($gs_mensagem(e));',
      '}',
    ]);
    expect(helpers).toEqual(['mensagem']);
  });
  it('membro desconhecido de objeto da biblioteca só troca o nome do objeto', () => {
    expect(emit('prosa(Conta.inexistente)').code).toBe('console.log(Math.inexistente);');
  });
  it('acesso computado a objeto da biblioteca só troca o nome do objeto', () => {
    expect(emit('prosa(Conta["PI"])').code).toBe('console.log(Math["PI"]);');
  });
  it('ajudante encadeado depois de valor entre parênteses envolve o parêntese inteiro', () => {
    expect(firstLine('prosa((7.5).com_casas(2).trocar(".", ","))')).toBe(
      'console.log($gs_trocar((7.5).toFixed(2), ".", ","));'
    );
    expect(firstLine('prosa(("a" mais "b").trocar("a", "c"))')).toBe(
      'console.log($gs_trocar(("a" + "b"), "a", "c"));'
    );
    const { code } = emit('tenta_aí { } se_der_ruim (e) { prosa((e).mensagem) }');
    expect(code.split('\n')[0]).toBe('try { } catch (e) { console.log($gs_mensagem((e))); }');
  });
  it('ajudante depois de ?. ou de comentário antes do ponto continua gerando JavaScript válido', () => {
    expect(firstLine('uai s é "ab"\nprosa(s?.trocar("a", "b"))')).toBe('const s = "ab";');
    expect(emit('uai s é "ab"\nprosa(s?.trocar("a", "b"))').code.split('\n')[1]).toBe('console.log($gs_trocar(s, "a", "b"));');
    expect(emit('uai s é "ab"\nprosa(s // c.d\n  .trocar("a", "b"))').code.split('\n').slice(1, 3)).toEqual([
      'console.log($gs_trocar(s,',
      ' "a", "b"));',
    ]);
  });
  it('no repl a biblioteca é reescrita, mas a pergunta fica com o ambiente', () => {
    expect(emit('prosa(Conta.PI)', 'repl').code).toBe("'use strict'; console.log(Math.PI);");
    expect(emit('uai t é "ab"\nprosa(t.o_tanto)', 'repl').code.split('\n')[1]).toBe(
      'console.log(t.length);'
    );
    const { code, helpers } = emit('pergunta("x")', 'repl');
    expect(code).toContain('await pergunta("x")');
    expect(helpers).toEqual([]);
  });
});
