import { describe, expect, it } from 'vitest';
import { createLookupGuard } from '../src/lookup-guard';
import { LOOKUP_MAX_PER_WINDOW, LOOKUP_MAX_TRACKED_NETWORKS, LOOKUP_WINDOW_MS } from '../src/lookup-guard.constants';

describe('createLookupGuard', () => {
  it('libera até o teto e barra o excedente com Retry-After', () => {
    const guard = createLookupGuard();
    for (let index = 0; index < LOOKUP_MAX_PER_WINDOW; index += 1) {
      expect(guard.check('1.1.1.1', 1000).allowed).toBe(true);
    }
    const blocked = guard.check('1.1.1.1', 1000 + 10_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSec).toBe(50);
  });

  it('isola redes diferentes', () => {
    const guard = createLookupGuard();
    for (let index = 0; index < LOOKUP_MAX_PER_WINDOW; index += 1) guard.check('a', 0);
    expect(guard.check('a', 1).allowed).toBe(false);
    expect(guard.check('b', 1).allowed).toBe(true);
  });

  it('reabre a janela depois do prazo', () => {
    const guard = createLookupGuard();
    for (let index = 0; index < LOOKUP_MAX_PER_WINDOW; index += 1) guard.check('a', 0);
    expect(guard.check('a', LOOKUP_WINDOW_MS).allowed).toBe(true);
  });

  it('mantém a memória limitada com muitas redes', () => {
    const guard = createLookupGuard();
    for (let index = 0; index < LOOKUP_MAX_TRACKED_NETWORKS + 10; index += 1) {
      expect(guard.check(`rede-${String(index)}`, 0).allowed).toBe(true);
    }
  });

  it('não solta a rajada de uma rede já barrada quando o mapa enche', () => {
    const guard = createLookupGuard();
    for (let index = 0; index < LOOKUP_MAX_PER_WINDOW; index += 1) guard.check('vitima', 0);
    expect(guard.check('vitima', 1).allowed).toBe(false);
    for (let index = 0; index < LOOKUP_MAX_TRACKED_NETWORKS; index += 1) {
      guard.check(`rede-${String(index)}`, 2);
    }
    expect(guard.check('vitima', 3).allowed).toBe(false);
  });
});
