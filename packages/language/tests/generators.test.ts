import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderAll } from '../generators/run.ts';
import { KEYWORDS, STDLIB } from '../src/index.ts';

const REPOSITORY_ROOT = resolve(import.meta.dirname, '../../..');
const EXPECTED_PATHS = [
  'docs/spec/o-que-mudou.md', 'docs/spec/vocabulario.lock.json',
  'packages/language/generated/cli-help.txt', 'packages/language/generated/completions.json',
  'packages/language/generated/error-phrases.generated.ts', 'packages/language/generated/glossary.json',
  'packages/language/generated/goiasscript.monarch.json', 'packages/language/generated/goiasscript.tmLanguage.json',
  'packages/language/generated/reference.md', 'packages/language/generated/snippets.json',
  'packages/language/src/js/js-members.generated.ts',
];

describe('geradores', () => {
  const files = renderAll();
  it('registra todos os geradores da §5.2', () => {
    expect(files.map((file) => file.path).sort()).toEqual([...EXPECTED_PATHS].sort());
  });
  it('é determinístico: duas execuções dão a mesma saída', () => {
    expect(renderAll()).toEqual(files);
  });
  it.each(EXPECTED_PATHS)('%s está igual ao arquivo versionado (diff vazio)', (path) => {
    const content = files.find((file) => file.path === path)?.content;
    expect(readFileSync(resolve(REPOSITORY_ROOT, path), 'utf8')).toBe(content);
  });
  it('não gera data nem caminho absoluto', () => {
    expect(files.filter((file) => /\/home\/|\d{4}-\d{2}-\d{2}T/u.test(file.content))).toEqual([]);
  });
});

describe('generate:check (CI)', () => {
  it('falha listando o arquivo quando um gerado fica desatualizado e passa depois de regerar', () => {
    const target = resolve(REPOSITORY_ROOT, 'docs/spec/o-que-mudou.md');
    const original = readFileSync(target, 'utf8');
    const run = (mode: string) => spawnSync('node', [resolve(REPOSITORY_ROOT, 'packages/language/generators/run.ts'), mode], { encoding: 'utf8' });
    try {
      writeFileSync(target, `${original}linha a mais\n`);
      const stale = run('--check');
      expect(stale.status).toBe(1);
      expect(stale.stderr).toContain('docs/spec/o-que-mudou.md');
    } finally {
      writeFileSync(target, original);
    }
    expect(run('--check').status).toBe(0);
  });
  it('o verify da raiz roda o check dos gerados', () => {
    const manifest = JSON.parse(readFileSync(resolve(REPOSITORY_ROOT, 'package.json'), 'utf8')) as { readonly scripts: Readonly<Record<string, string>> };
    expect(manifest.scripts['verify']).toContain('packages/language/generators/run.ts --check');
  });
});

describe('grafias ASCII nos geradores', () => {
  const files = renderAll();
  const contentOf = (path: string): string => files.find((file) => file.path === path)?.content ?? '';
  const asciiMember = 'comeca_com';
  const asciiKeyword = KEYWORDS.find((entry) => entry.asciiSpelling !== undefined)?.asciiSpelling ?? '';
  const asciiStdlib = STDLIB.find((entry) => entry.asciiName?.endsWith(asciiMember) === true)?.asciiName ?? '';

  it('o catálogo tem as grafias ASCII usadas nos testes', () => {
    expect(asciiKeyword).not.toBe('');
    expect(asciiStdlib).not.toBe('');
  });
  it('realça o membro ASCII no TextMate e no Monarch', () => {
    expect(contentOf('packages/language/generated/goiasscript.tmLanguage.json')).toContain(asciiMember);
    const monarch = JSON.parse(contentOf('packages/language/generated/goiasscript.monarch.json')) as { readonly library: readonly string[] };
    expect(monarch.library).toContain(asciiMember);
  });
  it.each(['docs/spec/vocabulario.lock.json', 'packages/language/generated/completions.json', 'packages/language/generated/glossary.json'])(
    'grava as grafias ASCII em %s',
    (path) => {
      const content = contentOf(path);
      expect(content).toContain(`"${asciiKeyword}"`);
      expect(content).toContain(`"${asciiStdlib}"`);
    },
  );
});
