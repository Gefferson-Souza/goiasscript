import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { hasPendingChangesets, resolveReleaseTarget } from '../../../scripts/release-target.ts';

const CLEAN = { changesetsPending: false } as const;
const PENDING = { changesetsPending: true } as const;

describe('resolveReleaseTarget', () => {
  it('manda o alpha para a dist-tag next', () => {
    expect(resolveReleaseTarget('v3.0.0-alpha.0', '3.0.0-alpha.0', CLEAN)).toEqual({ ok: true, version: '3.0.0-alpha.0', distTag: 'next' });
  });

  it('alpha segue em next mesmo com changeset pendente', () => {
    expect(resolveReleaseTarget('v3.0.0-alpha.0', '3.0.0-alpha.0', PENDING)).toMatchObject({ ok: true, distTag: 'next' });
  });

  it('v3.0.0 vira latest', () => {
    expect(resolveReleaseTarget('v3.0.0', '3.0.0', CLEAN)).toEqual({ ok: true, version: '3.0.0', distTag: 'latest' });
  });

  it('v3.0.0 com changeset pendente é recusada', () => {
    const result = resolveReleaseTarget('v3.0.0', '3.0.0', PENDING);
    expect(result).toMatchObject({ ok: false });
    expect(result.ok ? '' : result.reason).toContain('changeset');
  });

  it('v3.0.0 com manifesto 3.0.1 é recusada', () => {
    expect(resolveReleaseTarget('v3.0.0', '3.0.1', CLEAN)).toMatchObject({ ok: false });
  });

  it.each([
    ['v3.0', '3.0.0'],
    ['3.0.0', '3.0.0'],
    ['v3.0.0-beta.1', '3.0.0-beta.1'],
    ['v3.0.0-rc.1', '3.0.0-rc.1'],
    ['v3.0.0+build', '3.0.0'],
    ['v3.0.0-alpha.1', '3.0.0-alpha.0'],
    ['v2.0.0', '2.0.0'],
    ['v4.0.0', '4.0.0'],
  ])('recusa a tag %s com o pacote em %s', (tag, version) => {
    expect(resolveReleaseTarget(tag, version, CLEAN)).toMatchObject({ ok: false });
  });

  it('explica a recusa em goianês', () => {
    const result = resolveReleaseTarget('v3.0', '3.0.0', CLEAN);
    expect(result.ok ? '' : result.reason).toContain('Ô rapaz');
  });
});

describe('hasPendingChangesets', () => {
  let directory = '';

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-changeset-'));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  it('pasta vazia não tem pendência', () => {
    expect(hasPendingChangesets(directory)).toBe(false);
  });

  it('só README e config não contam como pendência', () => {
    fs.writeFileSync(path.join(directory, 'README.md'), '# Changesets\n');
    fs.writeFileSync(path.join(directory, 'config.json'), '{}');
    expect(hasPendingChangesets(directory)).toBe(false);
  });

  it('markdown solto sem frontmatter não conta', () => {
    fs.writeFileSync(path.join(directory, 'notas.md'), 'texto solto\n');
    expect(hasPendingChangesets(directory)).toBe(false);
  });

  it('um changeset de verdade conta como pendência', () => {
    fs.writeFileSync(path.join(directory, 'trem-bom.md'), '---\n"goiasscript": minor\n---\n\nbota o trem\n');
    expect(hasPendingChangesets(directory)).toBe(true);
  });

  it('changeset com BOM ou linha em branco antes do frontmatter conta como pendência', () => {
    fs.writeFileSync(path.join(directory, 'com-bom.md'), '\uFEFF\n  ---\n"goiasscript": patch\n---\n');
    expect(hasPendingChangesets(directory)).toBe(true);
  });

  it('pasta inexistente falha com mensagem em goianês', () => {
    expect(() => hasPendingChangesets(path.join(directory, 'nao-existe'))).toThrow(/Eita! Não achei a pasta de changesets/);
  });
});
