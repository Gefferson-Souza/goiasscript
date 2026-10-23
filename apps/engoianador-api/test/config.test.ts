import { describe, expect, it } from 'vitest';
import { parseConfig } from '../src/config';
import { makeEnv } from './helpers';

describe('parseConfig', () => {
  it('aceita a configuração padrão', () => {
    const result = parseConfig(makeEnv());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.config.rateLimitPerDay).toBe(20);
      expect(result.config.allowedOrigins).toContain('https://playground.goiasscript.com.br');
      expect(result.config.killSwitch).toBe(false);
    }
  });

  it('recusa limite não numérico', () => {
    const result = parseConfig(makeEnv({ RATE_LIMIT_PER_DAY: 'vinte' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(' ')).toContain('RATE_LIMIT_PER_DAY');
  });

  it('recusa limite zero ou negativo', () => {
    for (const value of ['0', '-5']) {
      const result = parseConfig(makeEnv({ MAX_INPUT_CHARS: value }));
      expect(result.ok).toBe(false);
    }
  });

  it('recusa origem http fora de localhost', () => {
    const result = parseConfig(makeEnv({ ALLOWED_ORIGINS: 'http://exemplo.com.br' }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(' ')).toContain('ALLOWED_ORIGINS');
  });

  it('aceita http em localhost', () => {
    expect(parseConfig(makeEnv({ ALLOWED_ORIGINS: 'http://localhost:3000' })).ok).toBe(true);
  });

  it('lista todos os problemas de uma vez', () => {
    const result = parseConfig(
      makeEnv({ RATE_LIMIT_PER_DAY: 'x', GLOBAL_DAILY_CAP: '0', ALLOWED_ORIGINS: 'ftp://a', QUOTA_LEDGER: undefined }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.length).toBeGreaterThanOrEqual(4);
  });

  it('recusa binding ausente', () => {
    const result = parseConfig(makeEnv({ ENGOIANADOR_CACHE: undefined }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.problems.join(' ')).toContain('ENGOIANADOR_CACHE');
  });

  it('liga o kill switch só com o texto true', () => {
    const on = parseConfig(makeEnv({ KILL_SWITCH: 'true' }));
    const off = parseConfig(makeEnv({ KILL_SWITCH: 'false' }));
    expect(on.ok && on.config.killSwitch).toBe(true);
    expect(off.ok && off.config.killSwitch).toBe(false);
  });
});
