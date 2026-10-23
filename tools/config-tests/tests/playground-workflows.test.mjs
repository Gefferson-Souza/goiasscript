import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const WORKFLOW_PATH = '.github/workflows/playground-e2e.yml';
const BROWSERS = ['chromium', 'firefox', 'webkit'];
const PINNED_ACTION = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const REPORT_ARTIFACT = 'playwright-report';

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
