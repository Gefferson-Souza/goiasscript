import { describe, expect, it } from 'vitest';
import { cacheKeyOf, normalizeForCache } from '../src/cache-key';

const PROMPT = 'p00000001';
const MODEL = 'modelo-a';

describe('normalizeForCache', () => {
  it('apara e junta espaços repetidos', () => {
    expect(normalizeForCache('  oi \t  mundo\n\n bão  ')).toBe('oi mundo bão');
  });
});

describe('cacheKeyOf', () => {
  it('espaços extras geram a mesma chave', async () => {
    expect(await cacheKeyOf('  oi   mundo ', PROMPT, MODEL)).toBe(await cacheKeyOf('oi mundo', PROMPT, MODEL));
  });

  it('NFC e NFD geram a mesma chave', async () => {
    const composed = 'coração';
    const decomposed = 'coração'.normalize('NFD');
    expect(composed).not.toBe(decomposed);
    expect(await cacheKeyOf(composed, PROMPT, MODEL)).toBe(await cacheKeyOf(decomposed, PROMPT, MODEL));
  });

  it('modelo diferente gera chave diferente', async () => {
    expect(await cacheKeyOf('oi', PROMPT, 'modelo-a')).not.toBe(await cacheKeyOf('oi', PROMPT, 'modelo-b'));
  });

  it('versão do prompt diferente gera chave diferente', async () => {
    expect(await cacheKeyOf('oi', 'p1', MODEL)).not.toBe(await cacheKeyOf('oi', 'p2', MODEL));
  });

  it('segue o formato v1:<prompt>:<modelo>:<sha256>', async () => {
    expect(await cacheKeyOf('oi', PROMPT, MODEL)).toMatch(/^v1:p00000001:modelo-a:[0-9a-f]{64}$/u);
  });

  it('texto diferente gera chave diferente', async () => {
    expect(await cacheKeyOf('oi', PROMPT, MODEL)).not.toBe(await cacheKeyOf('tchau', PROMPT, MODEL));
  });
});
