import { describe, expect, it } from 'vitest';
import { emit } from '../../support/lower.ts';

describe('preservação de linhas', () => {
  it('token da linha N sai na linha N', () => {
    const src = 'uai a é 1\n\n// c\nse_ocê_quiser (a é_igualim 1)\n{\n  prosa(a)\n}';
    const lines = emit(src).code.split('\n');
    expect(lines[3]).toBe('if (a === 1)');
    expect(lines[5]).toBe('  console.log(a);');
  });
  it('terminadores \\r\\n e \\r isolado são preservados', () => {
    expect(emit('uai a é 1\r\nprosa(a)').code).toBe('const a = 1;\r\nconsole.log(a);');
    expect(emit('uai a é 1\rprosa(a)').code).toBe('const a = 1;\rconsole.log(a);');
  });
  it('BOM é omitido', () => {
    expect(emit('﻿prosa(1)').code).toBe('console.log(1);');
  });
  it('BOM junto de edição na primeira posição', () => {
    expect(emit('﻿pergunta("a").gritando()').code.split('\n')[0]).toBe('(await $gs_pergunta("a")).toUpperCase();');
  });
  it('estática da biblioteca em duas linhas mantém as linhas', () => {
    const lines = emit('prosa(Conta\n  .maior(1, 2))').code.split('\n');
    expect(lines).toEqual(['console.log(Math.max', '(1, 2));']);
  });
});
