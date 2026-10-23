import { describe, expect, it } from 'vitest';
import { decodeShareLink, encodeShareLink } from '../lib/share-link.ts';

const base64url = (text: string): string => Buffer.from(text, 'utf8').toString('base64url');
const HASH = '#codigo=';
const MAX_BYTES = 8 * 1024;

describe('link de compartilhamento', () => {
  it('faz ida e volta com acento, NFD e emoji', () => {
    const source = 'prosa("Goiás, pão de queijo \u{1F9C0}")\n';
    const payload = encodeShareLink(source);
    expect(payload).not.toBeNull();
    expect(decodeShareLink(`${HASH}${String(payload)}`)).toBe(source);
  });

  it('só emite A-Z a-z 0-9 _ -', () => {
    expect(encodeShareLink('???>>>~~~ ção')).toMatch(/^[A-Za-z0-9_-]+$/u);
  });

  it('recusa codificar acima de 8 KB e aceita exatamente 8 KB', () => {
    expect(encodeShareLink('a'.repeat(MAX_BYTES))).not.toBeNull();
    expect(encodeShareLink('a'.repeat(MAX_BYTES + 1))).toBeNull();
  });

  it('recusa codificar texto vazio', () => {
    expect(encodeShareLink('')).toBeNull();
  });

  it('recusa decodificar acima de 8 KB', () => {
    expect(decodeShareLink(`${HASH}${base64url('a'.repeat(MAX_BYTES + 1))}`)).toBeNull();
  });

  it.each([
    ['sem o prefixo', 'abc'],
    ['payload vazio', HASH],
    ['caractere fora do alfabeto', `${HASH}abc$def`],
    ['base64 com padding', `${HASH}YQ==`],
    ['UTF-8 inválido', `${HASH}${Buffer.from([0xff, 0xfe, 0xfd]).toString('base64url')}`],
    ['base64 impossível', `${HASH}a`],
  ])('hash malformado (%s) devolve null', (_title, hash) => {
    expect(decodeShareLink(hash)).toBeNull();
  });

  it('devolve o texto cru, sem interpretar HTML', () => {
    const html = '<img src=x onerror=alert(1)>';
    expect(decodeShareLink(`${HASH}${base64url(html)}`)).toBe(html);
  });
});
