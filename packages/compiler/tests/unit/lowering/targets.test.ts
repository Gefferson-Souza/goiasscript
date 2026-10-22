import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('alvos', () => {
  it('playground e repl começam com use strict na linha 1', () => {
    expect(emit('prosa(1)', 'playground').code.startsWith("'use strict'; ")).toBe(true);
    expect(emit('uai a é 1', 'repl').code.split('\n')[0]).toBe("'use strict'; let a; a = 1;");
  });
  it('module não ganha diretiva nem prefixo', () => {
    expect(emit('uai a é 1').code).toBe('const a = 1;');
  });
  it('repl: declarações do topo viram atribuição e let lista todos os nomes', () => {
    const { code } = emit('uai x é 5\nfaz_trem f() { faz_favor x }\narruma_trem C {}', 'repl');
    expect(code).toBe("'use strict'; let x, f, C; x = 5;\nf = function f() { return x; };\nC = class C {};");
  });
  it('repl: trem sem valor vira atribuição de indefinido', () => {
    expect(emit('trem a', 'repl').code).toBe("'use strict'; let a; a = undefined;");
  });
  it('repl: await no topo vai em (async () => { … })() e a última expressão recebe return', () => {
    const { code } = emit('uai a é 1\nespera_um_cadim a\na mais 1', 'repl');
    expect(code.split('\n')[0]).toContain('(async () => {');
    expect(code).toMatch(/return a \+ 1;/u);
    expect(code.trimEnd().endsWith('})()')).toBe(true);
  });
  it('repl: pergunta é função do hospedeiro, com await e sem ajudante', () => {
    const { code, helpers } = emit('uai n é pergunta("x")', 'repl');
    expect(code).toBe("'use strict'; let n; (async () => { n = await pergunta(\"x\");\n})()");
    expect(helpers).toEqual([]);
  });
  it('repl: sem await no topo a última expressão fica solta para o eco', () => {
    expect(emit('uai a é 1\na mais 1', 'repl').code).toBe("'use strict'; let a; a = 1;\na + 1;");
  });
  it('repl: pergunta dentro de função não envolve o topo', () => {
    const { code } = emit('vai_na_frente faz_trem f() { faz_favor pergunta("x") }', 'repl');
    expect(code).not.toContain('(async () => {');
  });
  it('trava de laço: tick global logo depois da { na mesma linha', () => {
    const { code } = emit('enquanto_tiver (certeza) {\n  prosa(1)\n}', 'playground', 1000);
    expect(code.split('\n')[0]).toContain('{ $gs_tick(1);');
    expect(code).toMatch(/function \$gs_tick\(/u);
    expect(code).toContain('1000');
  });
  it('trava de laço usa o limite padrão quando não há loopLimit', () => {
    expect(emit('enquanto_tiver (certeza) { para_com_isso }', 'playground').code).toContain('1000000');
  });
  it('module não recebe trava de laço', () => {
    expect(emit('enquanto_tiver (certeza) { para_com_isso }', 'module', 5).code).not.toContain('$gs_tick');
  });
  it('o tick usa um contador só e relança depois de estourar', () => {
    const { code } = emit('vai_indo (trem i é 0; i menor_que 2; i é i mais 1) { prosa(i) }', 'playground', 3);
    const helper = code.slice(code.indexOf('function $gs_tick'));
    const tick = runInNewContext(`${helper}; $gs_tick`) as (line: number) => void;
    tick(1);
    tick(1);
    tick(1);
    expect(() => {
      tick(7);
    }).toThrow(/GS0701/u);
    expect(() => {
      tick(7);
    }).toThrow(/GS0701/u);
  });
  it('nome que já está na sessão não entra no let do repl', () => {
    const session = { bindings: [{ name: 'z', kind: 'trem' as const }], members: [] };
    const { code } = emit('uai w é 1\ntrem z é 2', 'repl', undefined, session);
    expect(code).toBe("'use strict'; let w; w = 1;\nz = 2;");
  });
  it('repl: todos os nomes na sessão deixam só o use strict', () => {
    const session = { bindings: [{ name: 'z', kind: 'trem' as const }], members: [] };
    expect(emit('trem z é 2', 'repl', undefined, session).code).toBe("'use strict'; z = 2;");
  });
});
