import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const PINNED_ACTION = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const WEEKLY_CRON = /^\d+ \d+ \* \* \d$/;
const SECRET_REFERENCE = /secrets\./g;
const SECRET_NAME = 'GROQ_API_KEY';

const load = (name) => {
  const text = fs.readFileSync(path.join(ROOT_DIR, '.github/workflows', name), 'utf8');
  const workflow = parse(text);
  const steps = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);
  return { text, workflow, steps, commands: steps.map((step) => step.run ?? '').join('\n') };
};

const contract = load('engoianador-contract.yml');
const smoke = load('engoianador-smoke.yml');

describe.each([
  ['engoianador-contract.yml', contract],
  ['engoianador-smoke.yml', smoke],
])('%s', (_name, { text, workflow, steps }) => {
  it('declara permissões mínimas de leitura no topo', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
  });
  it('pina toda action por SHA de 40 caracteres', () => {
    const uses = steps.map((step) => step.uses).filter((value) => value !== undefined);
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((value) => !PINNED_ACTION.test(value))).toEqual([]);
  });
  it('não usa pull_request_target', () => {
    expect(text).not.toContain('pull_request_target');
  });
});

describe('engoianador-contract.yml', () => {
  it('roda num cron semanal e manualmente', () => {
    expect(Object.keys(contract.workflow.on).sort()).toEqual(['schedule', 'workflow_dispatch']);
    const crons = contract.workflow.on.schedule.map((entry) => entry.cron);
    expect(crons).toHaveLength(1);
    expect(crons[0]).toMatch(WEEKLY_CRON);
  });
  it('referencia o segredo uma vez, só no env de um passo', () => {
    expect(contract.text.match(SECRET_REFERENCE)).toHaveLength(1);
    const holders = contract.steps.filter((step) => JSON.stringify(step.env ?? {}).includes(`secrets.${SECRET_NAME}`));
    expect(holders).toHaveLength(1);
    expect(holders[0].run).toContain('contract-check.ts');
    expect(Object.values(contract.workflow.jobs).every((job) => job.env === undefined)).toBe(true);
    expect(contract.commands).not.toContain('secrets.');
  });
  it('lê a URL da variável do repositório, nunca de texto fixo', () => {
    expect(contract.text).toContain('vars.ENGOIANADOR_URL');
  });
});

describe('engoianador-smoke.yml', () => {
  it('só dispara manualmente, com base_url obrigatória', () => {
    expect(Object.keys(smoke.workflow.on)).toEqual(['workflow_dispatch']);
    expect(smoke.workflow.on.workflow_dispatch.inputs.base_url.required).toBe(true);
  });
  it('recusa base_url sem https antes de qualquer passo que use o código', () => {
    expect(smoke.commands).toContain('new URL');
    expect(smoke.commands).toContain('"https:"');
    expect(smoke.commands).not.toContain('grep');
    expect(smoke.commands).not.toContain('${{ inputs.base_url }}');
    expect(smoke.text).toContain('${{ inputs.base_url }}');
    const checkIndex = smoke.steps.findIndex((step) => (step.run ?? '').includes('new URL'));
    const checkoutIndex = smoke.steps.findIndex((step) => step.uses?.startsWith('actions/checkout@'));
    expect(checkIndex).toBeLessThan(checkoutIndex);
  });
  describe('validação executada de verdade', () => {
    const validation = smoke.steps.find((step) => (step.run ?? '').includes('new URL'))?.run ?? '';
    const exitCodeFor = (value) => spawnSync('bash', ['-c', validation], { env: { ...process.env, ENGOIANADOR_URL: value } }).status;

    it('aceita um endereço https de uma linha só', () => {
      expect(exitCodeFor('https://engoianador.exemplo.workers.dev')).toBe(0);
    });
    it.each([
      ['http simples', 'http://exemplo.com'],
      ['várias linhas', 'https://exemplo.com\nhttp://malicioso.com'],
      ['com espaço', 'https://exemplo.com extra'],
      ['vazio', ''],
      ['sem esquema', 'exemplo.com'],
    ])('recusa %s', (_name, value) => {
      expect(exitCodeFor(value)).toBe(1);
    });
  });
  it('não usa segredo', () => {
    expect(smoke.text).not.toContain('secrets.');
  });
});
