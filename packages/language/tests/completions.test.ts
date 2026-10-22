import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { COMPLETION_LABELS } from '../src/index.ts';

const GENERATED = resolve(import.meta.dirname, '../generated/completions.json');

describe('COMPLETION_LABELS', () => {
  const labels = COMPLETION_LABELS.map((entry) => entry.label);
  it('contém as grafias oficiais e sem acento, métodos e estáticos', () => {
    expect(labels).toEqual(expect.arrayContaining(['se_ocê_quiser', 'se_oce_quiser', 'mapear', 'Conta.maior']));
  });
  it('liga a grafia sem acento à oficial', () => {
    const plain = COMPLETION_LABELS.find((entry) => entry.label === 'se_oce_quiser');
    expect(plain?.canonical).toBe('se_ocê_quiser');
  });
  it('marca como membro só o que se chama depois de um ponto', () => {
    const memberOf = (label: string): boolean | undefined => COMPLETION_LABELS.find((entry) => entry.label === label)?.member;
    expect([memberOf('mapear'), memberOf('Conta.maior'), memberOf('prosa'), memberOf('mais')]).toEqual([true, false, false, false]);
  });
  it('é igual, rótulo a rótulo, ao completions.json gerado', () => {
    const generated = JSON.parse(readFileSync(GENERATED, 'utf8')) as readonly { readonly label: string }[];
    expect(labels).toEqual(generated.map((entry) => entry.label));
  });
});
