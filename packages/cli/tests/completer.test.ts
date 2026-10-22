import { describe, expect, it } from 'vitest';
import { completeLine } from '../src/repl/completer.ts';

describe('completeLine', () => {
  it('completa pelo prefixo sem acento e devolve só a grafia oficial', () => {
    expect(completeLine('se_oc', [])).toEqual([['se_ocê_quiser'], 'se_oc']);
    expect(completeLine('se_oce', [])).toEqual([['se_ocê_quiser'], 'se_oce']);
  });
  it('lista candidatos pelo trecho final e inclui os nomes da sessão', () => {
    const [hits, token] = completeLine('prosa(ma', []);
    expect(token).toBe('ma');
    expect(hits).toEqual(expect.arrayContaining(['mapear', 'mais']));
    expect(completeLine('tota', [{ name: 'total', kind: 'uai' }])[0]).toEqual(['total']);
  });
  it('completa estático e membro depois do ponto', () => {
    expect(completeLine('Conta.so', [])[0]).toEqual(['Conta.sorteia_um']);
    expect(completeLine('lista.ma', [])[0]).toEqual(['lista.mapear']);
  });
  it('sem trecho não despeja o vocabulário inteiro', () => {
    expect(completeLine('prosa(', [])).toEqual([[], '']);
    expect(completeLine('lista.', [])).toEqual([[], 'lista.']);
  });
  it('não repete candidato quando a sessão tem o mesmo nome do vocabulário', () => {
    expect(completeLine('mapea', [{ name: 'mapear', kind: 'uai' }])[0]).toEqual(['mapear']);
  });
});
