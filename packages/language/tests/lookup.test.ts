import { describe, expect, it } from 'vitest';
import { lookupJsMember, lookupJsReserved, lookupKeyword, lookupRetiredWord, lookupStdlibGlobal, lookupStdlibMember, lookupStdlibStatic } from '../src/lookup.ts';

describe('lookup', () => {
  it('acha keyword pela grafia oficial e pela variante sem acento', () => {
    expect(lookupKeyword('se_ocê_quiser')).toBe(lookupKeyword('se_oce_quiser'));
    expect(lookupKeyword('se_ocê_quiser')?.js).toBe('if');
    expect(lookupKeyword('lista')).toBeUndefined();
  });
  it('acha reservada do JS, palavra aposentada e membros da biblioteca', () => {
    expect(lookupJsReserved('const')?.suggestion).toBe('uai');
    expect(lookupRetiredWord('vazio')?.replacement).toBe('nada');
    expect(lookupStdlibMember('o_tanto').map((entry) => entry.js)).toEqual(['length']);
    expect(lookupStdlibMember('comeca_com')).toHaveLength(1);
    expect(lookupStdlibMember('prosa')).toEqual([]);
    expect(lookupStdlibGlobal('prosa')?.js).toBe('console.log');
    expect(lookupStdlibGlobal('Conta')?.js).toBe('Math');
    expect(lookupStdlibGlobal('Promessa')?.js).toBe('Promise');
    expect(lookupStdlibStatic('Conta', 'maior')?.js).toBe('Math.max');
    expect(lookupStdlibStatic('Promessa', 'tudim_junto')?.js).toBe('Promise.all');
    expect(lookupStdlibStatic('Conta', 'nada')).toBeUndefined();
  });
  it('liga membro nativo do JS ao equivalente goiano', () => {
    const equivalents = ['map', 'length', 'sort', 'keys', 'catch', 'message', 'replaceAll', 'some', 'every', 'splice'].map((name) => lookupJsMember(name)?.equivalent);
    expect(equivalents).toEqual(['mapear', 'o_tanto', 'arruma', 'Coisa.chaves', 'se_der_ruim', 'mensagem', 'trocar', 'tem_algum', 'todin', 'ranca_do_meio']);
    expect(lookupJsMember('flatMap')).toEqual({ name: 'flatMap' });
    expect(lookupJsMember('gato')).toBeUndefined();
  });
});
