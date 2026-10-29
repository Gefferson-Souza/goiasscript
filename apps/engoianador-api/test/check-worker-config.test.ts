import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { checkWranglerConfig } from '../scripts/wrangler-check.ts';

const WRANGLER_URL = new URL('../wrangler.toml', import.meta.url);
const PLACEHOLDER_ID = /COLE_O_ID_DE_(\w+)/gu;
const PRODUCTION_CACHE_ID = /(binding = "ENGOIANADOR_CACHE"\nid = )"[^"]*"/u;

function realIds(): string {
  return readFileSync(fileURLToPath(WRANGLER_URL), 'utf8').replace(PLACEHOLDER_ID, (_match, name: string) => name.toLowerCase().padEnd(32, '0'));
}

function withoutBlock(toml: string, header: string): string {
  return toml.replace(new RegExp(`\\[\\[${header}\\]\\][^\\[]*`, 'u'), '');
}

describe('origens do wrangler.toml', () => {
  const toml = readFileSync(fileURLToPath(WRANGLER_URL), 'utf8');
  const [production = '', devEnvironment = ''] = toml.split('[env.dev.vars]');

  it('produção não aceita origem local', () => {
    expect(production).not.toContain('localhost');
  });

  it('o ambiente dev guarda a origem local', () => {
    expect(devEnvironment).toContain('http://localhost:3000');
  });
});

describe('checkWranglerConfig', () => {
  it('aceita o wrangler.toml completo', () => {
    expect(checkWranglerConfig(realIds())).toEqual([]);
  });

  it('recusa id de KV placeholder', () => {
    const toml = realIds().replace(PRODUCTION_CACHE_ID, '$1"COLE_O_ID_DE_ENGOIANADOR_CACHE"');
    expect(toml).not.toBe(realIds());
    expect(checkWranglerConfig(toml).some((problem) => problem.includes('ENGOIANADOR_CACHE'))).toBe(true);
  });

  it('recusa origem local nas vars de produção', () => {
    const toml = realIds().replace('ALLOWED_ORIGINS = "https://', 'ALLOWED_ORIGINS = "http://localhost:3000,https://');
    expect(checkWranglerConfig(toml).some((problem) => problem.includes('ALLOWED_ORIGINS'))).toBe(true);
  });

  it('recusa RATE_LIMIT_PER_DAY não numérico', () => {
    const toml = realIds().replace('RATE_LIMIT_PER_DAY = "20"', 'RATE_LIMIT_PER_DAY = "vinte"');
    expect(checkWranglerConfig(toml).some((problem) => problem.includes('RATE_LIMIT_PER_DAY'))).toBe(true);
  });

  it('recusa limite zero', () => {
    const toml = realIds().replace('GLOBAL_DAILY_CAP = "2000"', 'GLOBAL_DAILY_CAP = "0"');
    expect(checkWranglerConfig(toml).some((problem) => problem.includes('GLOBAL_DAILY_CAP'))).toBe(true);
  });

  it('recusa binding de DO ausente', () => {
    const problems = checkWranglerConfig(withoutBlock(realIds(), 'durable_objects.bindings'));
    expect(problems.some((problem) => problem.includes('QUOTA_LEDGER'))).toBe(true);
  });

  it('recusa DO sem migração', () => {
    const problems = checkWranglerConfig(withoutBlock(realIds(), 'migrations'));
    expect(problems.some((problem) => problem.includes('QuotaLedgerObject'))).toBe(true);
  });

  it('recusa migração que não declara a classe como SQLite', () => {
    const toml = realIds().replace('new_sqlite_classes = ["QuotaLedgerObject"]', 'new_classes = ["QuotaLedgerObject"]');
    expect(checkWranglerConfig(toml).some((problem) => problem.includes('new_sqlite_classes'))).toBe(true);
  });

  it('recusa KV de cache ausente', () => {
    const toml = realIds().replace(/\[\[kv_namespaces\]\]\nbinding = "ENGOIANADOR_CACHE"[^[]*/u, '');
    expect(checkWranglerConfig(toml).some((problem) => problem.includes('ENGOIANADOR_CACHE'))).toBe(true);
  });

  it('recusa binding de IA ausente', () => {
    const toml = realIds().replace(/\[ai\][^[]*/u, '');
    expect(checkWranglerConfig(toml).some((problem) => problem.includes('AI'))).toBe(true);
  });

  it('recusa TOML inválido', () => {
    expect(checkWranglerConfig('isso = = nao é toml').length).toBeGreaterThan(0);
  });
});
