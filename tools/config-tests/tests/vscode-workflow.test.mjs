import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const WORKFLOW_PATH = '.github/workflows/vscode.yml';
const MANIFEST_PATH = 'packages/vscode/package.json';
const PINNED_ACTION = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const OPERATING_SYSTEMS = ['ubuntu-24.04', 'windows-2025', 'macos-15'];
const STABLE_VERSION = 'stable';

const text = fs.readFileSync(path.join(ROOT_DIR, WORKFLOW_PATH), 'utf8');
const workflow = parse(text);
const jobs = Object.values(workflow.jobs);
const steps = jobs.flatMap((job) => job.steps ?? []);
const commands = steps.map((step) => step.run ?? '').join('\n');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, MANIFEST_PATH), 'utf8'));
const minimumVersion = manifest.engines.vscode.replace(/^\^/u, '');

describe('vscode.yml', () => {
  it('declara permissão mínima de leitura no topo', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
  });

  it('roda a matriz em Ubuntu, Windows e macOS', () => {
    const matrices = jobs.map((job) => job.strategy?.matrix?.os).filter((value) => value !== undefined);
    expect(matrices).toEqual([OPERATING_SYSTEMS]);
  });

  it('testa a versão estável e a do engines do manifesto', () => {
    const matrices = jobs.map((job) => job.strategy?.matrix?.vscode).filter((value) => value !== undefined);
    expect(matrices).toEqual([[STABLE_VERSION, minimumVersion]]);
  });

  it('usa display virtual no Linux e só lá', () => {
    const virtualDisplay = steps.filter((step) => (step.run ?? '').includes('xvfb-run'));
    expect(virtualDisplay).toHaveLength(1);
    expect(virtualDisplay[0].if).toContain("runner.os == 'Linux'");
    const others = steps.filter((step) => (step.run ?? '').includes('test:integration') && !(step.run ?? '').includes('xvfb-run'));
    expect(others.length).toBeGreaterThan(0);
    for (const step of others) expect(step.if).toContain("runner.os != 'Linux'");
  });

  it('empacota a extensão antes de rodar os testes e passa a versão pelo ambiente', () => {
    expect(commands.indexOf('build:vscode')).toBeGreaterThanOrEqual(0);
    expect(commands.indexOf('build:vscode')).toBeLessThan(commands.indexOf('test:integration'));
    expect(text).toContain('VSCODE_VERSION: ${{ matrix.vscode }}');
    expect(commands).not.toContain('${{ matrix.vscode }}');
  });

  it('pina toda action por SHA de 40 caracteres', () => {
    const usedActions = steps.map((step) => step.uses).filter((uses) => uses !== undefined);
    expect(usedActions.length).toBeGreaterThan(0);
    expect(usedActions.filter((uses) => !PINNED_ACTION.test(uses))).toEqual([]);
  });

  it('guarda o download do VS Code em cache por sistema e versão', () => {
    const cache = steps.find((step) => step.uses?.startsWith('actions/cache@'));
    expect(cache?.with?.path).toBe('packages/vscode/.vscode-test');
    expect(cache?.with?.key).toContain('matrix.os');
    expect(cache?.with?.key).toContain('matrix.vscode');
  });

  it('não usa segredo nem pull_request_target', () => {
    expect(text).not.toContain('secrets.');
    expect(text).not.toContain('pull_request_target');
  });

  it('usa Node 24', () => {
    const setup = steps.find((step) => step.uses?.startsWith('actions/setup-node@'));
    expect(setup?.with?.['node-version']).toBe(24);
  });
});
