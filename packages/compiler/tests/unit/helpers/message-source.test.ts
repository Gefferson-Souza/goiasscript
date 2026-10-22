import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { lookupDiagnostic } from '@goiasscript/language';
import { buildMessageSource, phrasesFromCatalog } from '../../../src/helpers/message-source.ts';

const message = vm.runInNewContext(`${buildMessageSource(phrasesFromCatalog())}\n$gs_mensagem`) as (error: unknown) => string;
const rootPhrase = (code: string): string => lookupDiagnostic(code)?.messages.raiz ?? '';

describe('$gs_mensagem', () => {
  it('traduz GS0703 e GS0702 para a frase do catálogo, sem undefined', () => {
    expect(message(Object.assign(new Error('x'), { gsCode: 'GS0703' }))).toBe(rootPhrase('GS0703'));
    expect(message(Object.assign(new Error('x'), { gsCode: 'GS0702' }))).toBe(rootPhrase('GS0702'));
  });
  it('preenche a linha do GS0701', () => {
    expect(message(Object.assign(new Error('x'), { gsCode: 'GS0701', gsLine: 3 }))).toContain('linha 3');
  });
  it('não deixa marcador nem undefined no GS0701 sem linha', () => {
    const text = message(Object.assign(new Error('x'), { gsCode: 'GS0701' }));
    expect(text).not.toMatch(/\{|undefined|«/u);
  });
});
