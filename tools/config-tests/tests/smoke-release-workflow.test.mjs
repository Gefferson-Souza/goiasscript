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

  it('dispara o smoke do playground e o da extensão por workflow_dispatch', () => {
    const commands = scriptsOf(workflow.jobs.dispatch);
    expect(commands).toContain('gh workflow run playground-smoke.yml');
    expect(commands).toContain('gh workflow run smoke-extension.yml');
  });

  it('só o job de disparo recebe permissão de actions', () => {
    const withActions = Object.entries(workflow.jobs).filter(([, job]) => job.permissions?.actions === 'write');
    expect(withActions.map(([id]) => id)).toEqual(['dispatch']);
  });

  it('não interpola entradas direto no script', () => {
    const scripts = Object.values(workflow.jobs).map(scriptsOf).join('\n');
    expect(scripts).not.toContain('${{');
  });
});
