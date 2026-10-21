import { describe, expect, it } from 'vitest';
import { lookupDiagnostic } from '@goiasscript/language';
import { formatMessage } from '../../src/diagnostics/format-message.ts';

type Tone = 'raiz' | 'neutro';
const say = (code: string, tone: Tone, args: Record<string, string>) => formatMessage(lookupDiagnostic(code)?.messages[tone] ?? '', args);

describe('formatMessage e frases da §4.11', () => {
  it('troca marcadores e esconde trecho opcional sem valor', () => {
    expect(formatMessage('a {x}[[ b {y}]]', { x: '1' })).toBe('a 1');
    expect(formatMessage('a {x}[[ b {y}]]', { x: '1', y: '2' })).toBe('a 1 b 2');
    expect(formatMessage('{z}', {})).toBe('«z»');
  });
  it.each([
    ['GS0401', { name: 'const', suggestion: 'uai' }, 'Ô sô, "const" é palavra do JavaScript. Aqui em GoiásScript a gente fala "uai".', '"const" é do JavaScript. Em GoiásScript, use "uai".'],
    ['GS0301', { name: 'nomi', suggestion: 'nome' }, 'Esse trem "nomi" não existe por aqui. Cê quis dizer "nome"?', 'O nome "nomi" não foi declarado. Você quis dizer "nome"?'],
    ['GS0801', { construct: 'se_ocê_quiser' }, 'Dentro do "se_ocê_quiser" cê usou "é", que guarda valor. Pra comparar é "é_igualim".', 'Na condição foi usado "é" (atribuição). Para comparar, use "é_igualim".'],
    ['GS0601', { name: 'o_tanto', description: 'tamanho de texto e de lista', suggestion: 'quantidade' }, 'Ô sô, "o_tanto" já é nome de trem da biblioteca (tamanho de texto e de lista). Pra esse campo, que tal "quantidade"?', '"o_tanto" é nome da biblioteca padrão (tamanho de texto e de lista). Para este campo, use outro nome, como "quantidade".'],
    ['GS0406', { name: 'toString' }, 'Ô sô, ".toString" é do JavaScript e esse trem ainda não tem nome goiano por aqui.', '".toString" é um recurso do JavaScript que ainda não tem nome em GoiásScript.'],
    ['GS0208', { suggestion: '10.50' }, 'Ô sô, número com vírgula não rola. Aqui o decimal é com ponto: 10.50.', 'Decimais usam ponto, não vírgula. Escreva 10.50.'],
  ])('%s reproduz a frase do spec nos dois tons', (code, args, rootText, neutralText) => {
    expect(say(code, 'raiz', args)).toBe(rootText);
    expect(say(code, 'neutro', args)).toBe(neutralText);
  });
  it('GS0305 segue o formato do GS0301, sem a pergunta quando não há sugestão', () => {
    expect(say('GS0305', 'raiz', { name: 'nomi', suggestion: 'nome' })).toBe('Esse trem ".nomi" não existe por aqui. Cê quis dizer ".nome"?');
    expect(say('GS0305', 'raiz', { name: 'nomi' })).toBe('Esse trem ".nomi" não existe por aqui.');
  });
});
