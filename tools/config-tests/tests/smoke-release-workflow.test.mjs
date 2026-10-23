import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const WORKFLOW = '.github/workflows/smoke-release.yml';
const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const text = fs.readFileSync(path.join(ROOT_DIR, WORKFLOW), 'utf8');
const workflow = parse(text);
const scriptsOf = (job) => (job.steps ?? []).map((step) => step.run ?? '').join('\n');

describe('smoke-release.yml', () => {
  it('só workflow_dispatch', () => {
    expect(Object.keys(workflow.on)).toEqual(['workflow_dispatch']);
  });

  it('sem secrets nem token de npm', () => {
    expect(['secrets.', 'NPM_TOKEN', 'NODE_AUTH_TOKEN'].filter((word) => text.includes(word))).toEqual([]);
  });

  it('dá só leitura de conteúdo no topo', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
  });

  it('oferece a escolha entre latest e next', () => {
    expect(workflow.on.workflow_dispatch.inputs.dist.options).toEqual(['latest', 'next']);
  });

  it('roda o smoke do pacote pelo script', () => {
    expect(scriptsOf(workflow.jobs.package)).toContain('scripts/smoke-release.ts');
  });

  it('chama o smoke do playground e o da extensão como workflows reutilizáveis, esperando o resultado', () => {
    expect(workflow.jobs.extension.uses).toBe('./.github/workflows/smoke-extension.yml');
    expect(workflow.jobs.playground.uses).toBe('./.github/workflows/playground-smoke.yml');
    expect(workflow.jobs.extension.needs).toBe('package');
    expect(workflow.jobs.playground.needs).toBe('package');
  });

  it('os dois workflows chamados aceitam workflow_call', () => {
    for (const file of ['smoke-extension.yml', 'playground-smoke.yml']) {
      const called = parse(fs.readFileSync(path.join(ROOT_DIR, '.github/workflows', file), 'utf8'));
      expect(Object.keys(called.on)).toContain('workflow_call');
    }
  });

  it('não dispara nada sem esperar (sem gh workflow run)', () => {
    expect(text).not.toContain('gh workflow run');
  });

  it('não interpola entradas direto no script', () => {
    const scripts = Object.values(workflow.jobs).map(scriptsOf).join('\n');
    expect(scripts).not.toContain('${{');
  });
});
