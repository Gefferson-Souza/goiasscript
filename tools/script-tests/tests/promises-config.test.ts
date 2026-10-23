import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const PINNED_ACTION = /uses:\s*lycheeverse\/lychee-action@[0-9a-f]{40}\s+#\s*v\d+\.\d+\.\d+/u;
const readText = (relative: string): string => fs.readFileSync(path.join(ROOT_DIR, relative), 'utf8');
const jobBlock = (workflow: string, job: string): string => workflow.split(new RegExp(`^ {2}${job}:`, 'mu'))[1]?.split(/^ {2}[\w-]+:/mu)[0] ?? '';

describe('promises-gate.yml', () => {
  const workflow = readText('.github/workflows/promises-gate.yml');

  it('roda os jobs de inglês, dependências, rastreabilidade e links', () => {
    for (const [job, command] of [['english-ui', 'pnpm english-ui'], ['compiler-dependencies', 'pnpm compiler-dependencies'], ['traceability', 'pnpm traceability']] as const) {
      expect(jobBlock(workflow, job)).toContain(command);
    }
    expect(jobBlock(workflow, 'links')).toContain('--offline');
  });

  it('o job de links usa a action fixada por SHA e falha o PR', () => {
    const links = jobBlock(workflow, 'links');
    expect(links).toMatch(PINNED_ACTION);
    expect(links).toContain('fail: true');
    expect(links).toContain('lycheeVersion: v');
  });
});

describe('scheduled.yml', () => {
  it('links-externos confere os links de fora, sem o modo offline', () => {
    const job = jobBlock(readText('.github/workflows/scheduled.yml'), 'links-externos');
    expect(job).toMatch(PINNED_ACTION);
    expect(job).not.toContain('--offline');
    expect(job).toContain('README.md');
  });
});

describe('lychee.toml', () => {
  const config = readText('lychee.toml');

  it('confere âncoras e deixa de fora os registros históricos', () => {
    expect(config).toContain('include_fragments = true');
    for (const ignored of ['docs/superpowers', 'docs/auditoria', 'docs/pesquisa', 'docs/fase-']) expect(config).toContain(ignored);
  });

  it('cada exclusão vem com a razão no comentário acima', () => {
    const lines = config.split('\n');
    lines.forEach((line, index) => {
      if (/^(exclude|exclude_path)\s*=/u.test(line)) expect(lines[index - 1]?.startsWith('#')).toBe(true);
    });
  });
});

describe('package.json', () => {
  const manifest = JSON.parse(readText('package.json')) as { readonly scripts: Readonly<Record<string, string>> };

  it('expõe os três checks e o verify roda todos', () => {
    for (const [script, file] of [['english-ui', 'check-english-ui.ts'], ['traceability', 'check-traceability.ts'], ['compiler-dependencies', 'check-compiler-dependencies.ts']] as const) {
      expect(manifest.scripts[script]).toContain(file);
      expect(manifest.scripts['verify']).toContain(`scripts/${file}`);
    }
  });
});
