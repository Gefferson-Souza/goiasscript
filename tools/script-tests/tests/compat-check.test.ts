import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pendingBump, replayOkCases, requiredBump, runCompatCheck, runCompatCli } from '../../../scripts/compat-check.ts';
import { createGitPort, parseChangeset } from '../../../scripts/compat-ports.ts';
import type { Changeset, CompatDeps, GitPort, VocabularyLock } from '../../../scripts/compat-check.types.ts';

const LOCK_PATH = 'docs/spec/vocabulario.lock.json';
const CONFORMANCE_DIR = 'packages/compiler/tests/conformance';
const PREVIOUS_TAG = 'v3.0.0';

const lock = (overrides: Partial<VocabularyLock> = {}): VocabularyLock => ({
  reserved: [{ name: 'uai', source: 'keyword', since: '3.0.0' }, { name: 'trem', source: 'keyword', since: '3.0.0' }],
  diagnostics: [{ code: 'GS0101', severity: 'error' }, { code: 'GS0201', severity: 'warning' }],
  ...overrides,
});
const changeset = (bump: 'patch' | 'minor' | 'major'): Changeset => ({ releases: { goiasscript: bump } });

function fakeGit(files: Readonly<Record<string, string>>, tags: readonly string[]): GitPort {
  return {
    listTags: () => Promise.resolve(tags),
    readFile: (ref, file) => Promise.resolve(files[`${ref}:${file}`] ?? null),
    listFiles: (ref, directory) => Promise.resolve(Object.keys(files).filter((key) => key.startsWith(`${ref}:${directory}/`)).map((key) => key.slice(ref.length + 1))),
  };
}

function deps(overrides: Partial<CompatDeps>): CompatDeps {
  return {
    git: fakeGit({ [`${PREVIOUS_TAG}:${LOCK_PATH}`]: JSON.stringify(lock()) }, [PREVIOUS_TAG]),
    currentTag: null,
    currentLock: lock(),
    changesets: [],
    compile: () => ({ ok: true }),
    ...overrides,
  };
}

describe('requiredBump', () => {
  it('sem diferença não exige nada', () => {
    expect(requiredBump(lock(), lock()).bump).toBe('none');
  });

  it('remover palavra exige major', () => {
    const next = lock({ reserved: [{ name: 'uai', source: 'keyword', since: '3.0.0' }] });
    const result = requiredBump(lock(), next);
    expect(result.bump).toBe('major');
    expect(result.reasons.join(' ')).toContain('trem');
  });

  it('palavra reservada nova exige major', () => {
    const next = lock({ reserved: [...lock().reserved, { name: 'novo', source: 'keyword', since: '3.1.0' }] });
    expect(requiredBump(lock(), next).bump).toBe('major');
  });

  it('renomear palavra exige major', () => {
    const next = lock({ reserved: [{ name: 'uai', source: 'keyword', since: '3.0.0' }, { name: 'trem2', source: 'keyword', since: '3.0.0' }] });
    expect(requiredBump(lock(), next).bump).toBe('major');
  });

  it('warning novo exige minor', () => {
    const next = lock({ diagnostics: [...lock().diagnostics, { code: 'GS0202', severity: 'warning' }] });
    expect(requiredBump(lock(), next).bump).toBe('minor');
  });

  it('error novo exige major', () => {
    const next = lock({ diagnostics: [...lock().diagnostics, { code: 'GS0102', severity: 'error' }] });
    expect(requiredBump(lock(), next).bump).toBe('major');
  });

  it('warning promovido a error exige major', () => {
    const next = lock({ diagnostics: [{ code: 'GS0101', severity: 'error' }, { code: 'GS0201', severity: 'error' }] });
    expect(requiredBump(lock(), next).bump).toBe('major');
  });

  it('código reutilizado com outra severidade exige major', () => {
    const next = lock({ diagnostics: [{ code: 'GS0101', severity: 'warning' }, { code: 'GS0201', severity: 'warning' }] });
    const result = requiredBump(lock(), next);
    expect(result.bump).toBe('major');
    expect(result.reasons.join(' ')).toContain('GS0101');
  });
});

describe('pendingBump', () => {
  it('sem changeset é none', () => {
    expect(pendingBump([])).toBe('none');
  });

  it('pega o maior bump entre os changesets', () => {
    expect(pendingBump([changeset('patch'), changeset('minor'), changeset('patch')])).toBe('minor');
  });
});

describe('replayOkCases', () => {
  const caseFiles = (id: string, diagnostics: string, extra: Readonly<Record<string, string>> = {}): Readonly<Record<string, string>> => ({
    [`${PREVIOUS_TAG}:${CONFORMANCE_DIR}/${id}/input.gs`]: `fonte ${id}`,
    [`${PREVIOUS_TAG}:${CONFORMANCE_DIR}/${id}/diagnostics.json`]: diagnostics,
    ...extra,
  });

  it('compila só os casos sem error e marca os que passam a falhar', async () => {
    const files = { ...caseFiles('ok-1', '[]'), ...caseFiles('ok-2', '[{"code":"GS0201","severity":"warning"}]'), ...caseFiles('bad', '[{"code":"GS0101","severity":"error"}]') };
    const results = await replayOkCases(PREVIOUS_TAG, (source) => ({ ok: source !== 'fonte ok-2' }), fakeGit(files, [PREVIOUS_TAG]));
    expect(results).toEqual([{ id: 'ok-1', nowFails: false }, { id: 'ok-2', nowFails: true }]);
  });

  it('ignora caso marcado como expected-fail', async () => {
    const files = caseFiles('xf', '[]', { [`${PREVIOUS_TAG}:${CONFORMANCE_DIR}/xf/case.json`]: '{"status":"expected-fail","issue":"GS-1"}' });
    expect(await replayOkCases(PREVIOUS_TAG, () => ({ ok: false }), fakeGit(files, [PREVIOUS_TAG]))).toEqual([]);
  });
});

describe('runCompatCheck', () => {
  it('sem tag anterior passa com aviso', async () => {
    const result = await runCompatCheck(deps({ git: fakeGit({}, []) }));
    expect(result.ok).toBe(true);
    expect(result.failures).toEqual([]);
    expect(result.warnings.join(' ')).toContain('tag');
  });

  it('ignora prerelease e a tag atual ao escolher a anterior', async () => {
    const git = fakeGit({ [`v3.0.1:${LOCK_PATH}`]: JSON.stringify(lock()) }, ['v3.0.0-alpha.1', 'v3.0.1', 'v3.0.2', 'v2.0.0', 'v3.0.10-rc.1']);
    const result = await runCompatCheck(deps({ git, currentTag: 'v3.0.2' }));
    expect(result.ok).toBe(true);
    expect(result.warnings).toEqual([]);
  });

  it('compara por SemVer e não por texto', async () => {
    const git = fakeGit({ [`v3.10.0:${LOCK_PATH}`]: JSON.stringify(lock()) }, ['v3.9.0', 'v3.10.0', 'v3.2.0']);
    const next = lock({ reserved: [] });
    const result = await runCompatCheck(deps({ git, currentLock: next, changesets: [changeset('major')] }));
    expect(result.ok).toBe(true);
  });

  it('mudança que exige major sem changeset falha', async () => {
    const result = await runCompatCheck(deps({ currentLock: lock({ reserved: [] }) }));
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('major');
  });

  it('changeset minor com mudança que exige major falha', async () => {
    const result = await runCompatCheck(deps({ currentLock: lock({ reserved: [] }), changesets: [changeset('minor')] }));
    expect(result.ok).toBe(false);
  });

  it('changeset major com remoção passa', async () => {
    const result = await runCompatCheck(deps({ currentLock: lock({ reserved: [] }), changesets: [changeset('major')] }));
    expect(result.ok).toBe(true);
  });

  it('warning novo com changeset patch falha e com minor passa', async () => {
    const currentLock = lock({ diagnostics: [...lock().diagnostics, { code: 'GS0202', severity: 'warning' }] });
    expect((await runCompatCheck(deps({ currentLock, changesets: [changeset('patch')] }))).ok).toBe(false);
    expect((await runCompatCheck(deps({ currentLock, changesets: [changeset('minor')] }))).ok).toBe(true);
  });

  it('caso ok que vira erro sem major falha', async () => {
    const files = {
      [`${PREVIOUS_TAG}:${LOCK_PATH}`]: JSON.stringify(lock()),
      [`${PREVIOUS_TAG}:${CONFORMANCE_DIR}/c1/input.gs`]: 'x',
      [`${PREVIOUS_TAG}:${CONFORMANCE_DIR}/c1/diagnostics.json`]: '[]',
    };
    const failing = deps({ git: fakeGit(files, [PREVIOUS_TAG]), compile: () => ({ ok: false }) });
    const result = await runCompatCheck(failing);
    expect(result.ok).toBe(false);
    expect(result.failures.join(' ')).toContain('c1');
    expect((await runCompatCheck({ ...failing, changesets: [changeset('major')] })).ok).toBe(true);
  });

  it('tag anterior sem o arquivo de vocabulário avisa e passa', async () => {
    const result = await runCompatCheck(deps({ git: fakeGit({}, [PREVIOUS_TAG]) }));
    expect(result.ok).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('portas reais', () => {
  const root = path.resolve(import.meta.dirname, '../../..');

  it('lê o frontmatter de um changeset', () => {
    const parsed = parseChangeset('---\n"goiasscript": minor\n"goiasscript-vscode": patch\n"fora": talvez\n---\n\nTexto.\n');
    expect(parsed.releases).toEqual({ goiasscript: 'minor', 'goiasscript-vscode': 'patch' });
  });

  it('changeset sem frontmatter não libera nada', () => {
    expect(parseChangeset('só texto').releases).toEqual({});
  });

  it('git real lê arquivo e lista diretório no HEAD e devolve null para o que não existe', async () => {
    const port = createGitPort(root);
    expect(JSON.parse((await port.readFile('HEAD', LOCK_PATH)) ?? 'null')).toHaveProperty('reserved');
    expect(await port.readFile('HEAD', 'nao/existe.txt')).toBeNull();
    expect((await port.listFiles('HEAD', CONFORMANCE_DIR)).length).toBeGreaterThan(0);
    expect(Array.isArray(await port.listTags())).toBe(true);
  });

  it('a CLI passa quando o vocabulário não mudou desde a tag anterior', async () => {
    const out: string[] = [];
    const code = await runCompatCli(root, { out: (text) => out.push(text), err: (text) => out.push(text) }, null);
    expect(code).toBe(0);
    expect(out.join('')).toContain('compat');
  });
});
