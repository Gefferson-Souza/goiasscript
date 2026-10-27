import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const WORKFLOW_PATH = '.github/workflows/playground-e2e.yml';
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const PINNED_ACTION = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const REPORT_ARTIFACT = 'playwright-report';
const INSTALL_TIMEOUT_MINUTES = 10;

const text = fs.readFileSync(path.join(ROOT_DIR, WORKFLOW_PATH), 'utf8');
const workflow = parse(text);
const jobs = Object.values(workflow.jobs);
const steps = jobs.flatMap((job) => job.steps ?? []);
const usedActions = steps.map((step) => step.uses).filter((uses) => uses !== undefined);

describe('playground-e2e.yml', () => {
  it('declara permissão mínima de leitura no topo', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
  });
  it('pina toda action por SHA de 40 caracteres', () => {
    expect(usedActions.length).toBeGreaterThan(0);
    expect(usedActions.filter((uses) => !PINNED_ACTION.test(uses))).toEqual([]);
  });
  it('roda a matriz de navegadores exatamente chromium, firefox e webkit', () => {
    const matrices = jobs.map((job) => job.strategy?.matrix?.browser).filter((value) => value !== undefined);
    expect(matrices).toEqual([BROWSERS]);
  });
  it('instala os navegadores com as dependências do sistema', () => {
    const commands = steps.map((step) => step.run ?? '').join('\n');
    expect(commands).toMatch(/playwright install --with-deps/u);
  });
  it('limita o tempo da instalação para o apt travado falhar cedo', () => {
    const install = steps.find((step) => (step.run ?? '').includes('playwright install'));
    expect(install?.['timeout-minutes']).toBe(INSTALL_TIMEOUT_MINUTES);
  });
  it('envia o relatório como artefato somente em falha', () => {
    const upload = steps.find((step) => step.uses?.startsWith('actions/upload-artifact@'));
    expect(upload?.if).toBe('failure()');
    expect(upload?.with?.name).toContain(REPORT_ARTIFACT);
  });
  it('não usa segredo nem pull_request_target', () => {
    expect(text).not.toContain('secrets.');
    expect(text).not.toContain('pull_request_target');
  });
});

const SMOKE_PATH = '.github/workflows/playground-smoke.yml';
const smokeText = fs.readFileSync(path.join(ROOT_DIR, SMOKE_PATH), 'utf8');
const smoke = parse(smokeText);
const smokeSteps = Object.values(smoke.jobs).flatMap((job) => job.steps ?? []);
const smokeCommands = smokeSteps.map((step) => step.run ?? '').join('\n');

describe('playground-smoke.yml', () => {
  it('só dispara manualmente, com a entrada base_url obrigatória', () => {
    expect(Object.keys(smoke.on)).toEqual(['workflow_dispatch', 'workflow_call']);
    expect(smoke.on.workflow_dispatch.inputs.base_url.required).toBe(true);
  });
  it('declara permissão mínima de leitura no topo', () => {
    expect(smoke.permissions).toEqual({ contents: 'read' });
  });
  it('pina toda action por SHA de 40 caracteres', () => {
    const uses = smokeSteps.map((step) => step.uses).filter((value) => value !== undefined);
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((value) => !PINNED_ACTION.test(value))).toEqual([]);
  });
  it('valida base_url por regex https antes de usar e passa pelo ambiente', () => {
    expect(smokeCommands).toContain('^https://');
    expect(smokeCommands).not.toContain('${{ inputs.base_url }}');
    expect(smokeText).toContain('BASE_URL: ${{ inputs.base_url }}');
  });
  it('roda o script de smoke sem segredo nem pull_request_target', () => {
    expect(smokeCommands).toContain('run-smoke-playground.ts');
    expect(smokeText).not.toContain('secrets.');
    expect(smokeText).not.toContain('pull_request_target');
  });
  it('usa Node 24', () => {
    const setup = smokeSteps.find((step) => step.uses?.startsWith('actions/setup-node@'));
    expect(setup?.with?.['node-version']).toBe(24);
  });
});
