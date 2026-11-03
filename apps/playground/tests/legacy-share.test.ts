import { describe, expect, it } from 'vitest';
import { legacyShareTarget } from '../lib/landing/legacy-share.ts';
import { PLAYGROUND_ROUTE } from '../lib/landing/routes.constants.ts';

describe('link compartilhado antigo', () => {
  it('leva o código da página inicial pro playground sem perder o hash', () => {
    expect(legacyShareTarget('', '#codigo=abc_-1')).toBe(`${PLAYGROUND_ROUTE}#codigo=abc_-1`);
    expect(legacyShareTarget('?de=zap', '#codigo=abc')).toBe(`${PLAYGROUND_ROUTE}?de=zap#codigo=abc`);
  });

  it('sem código no hash fica na página inicial', () => {
    expect(legacyShareTarget('', '')).toBeNull();
    expect(legacyShareTarget('?codigo=x', '#outra-coisa')).toBeNull();
  });

  it('o playground mora em /playground', () => {
    expect(PLAYGROUND_ROUTE).toBe('/playground');
  });
});
