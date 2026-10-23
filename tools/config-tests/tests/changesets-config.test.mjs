import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const WORKSPACE_ROOTS = ['packages', 'apps', 'tools'];
const FIXED_GROUP = ['goiasscript', 'goiasscript-vscode'];
const PUBLIC_PACKAGES = new Set(FIXED_GROUP);
const PINNED_ACTION = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT_DIR, file), 'utf8'));
const config = readJson('.changeset/config.json');

const workspacePackages = WORKSPACE_ROOTS.flatMap((root) =>
  fs.readdirSync(path.join(ROOT_DIR, root), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(ROOT_DIR, root, entry.name, 'package.json')))
    .map((entry) => readJson(`${root}/${entry.name}/package.json`)),
);

describe('.changeset/config.json', () => {
  it('grupo fixo cli e vscode', () => {
    expect(config.fixed).toEqual([FIXED_GROUP]);
  });

  it('pacotes privados ignorados', () => {
    const privateNames = workspacePackages.filter((pkg) => !PUBLIC_PACKAGES.has(pkg.name)).map((pkg) => pkg.name);
    expect(privateNames.length).toBeGreaterThan(0);
    expect([...config.ignore].sort()).toEqual(privateNames.sort());
  });

  it('não faz commit sozinho', () => {
    expect(config.commit).toBe(false);
  });

  it('o grupo fixo existe no monorepo', () => {
    const names = workspacePackages.map((pkg) => pkg.name);
    expect(FIXED_GROUP.filter((name) => !names.includes(name))).toEqual([]);
  });

  it('o script changeset existe na raiz com versão exata', () => {
    const root = readJson('package.json');
    expect(root.scripts.changeset).toBe('changeset');
    expect(root.devDependencies['@changesets/cli']).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('compat.yml', () => {
  const text = fs.readFileSync(path.join(ROOT_DIR, '.github/workflows/compat.yml'), 'utf8');
  const workflow = parse(text);
  const steps = Object.values(workflow.jobs).flatMap((job) => job.steps ?? []);

  it('roda em pull_request com fetch-depth 0', () => {
    expect(workflow.on).toHaveProperty('pull_request');
    const checkout = steps.find((step) => String(step.uses ?? '').startsWith('actions/checkout@'));
    expect(checkout.with['fetch-depth']).toBe(0);
  });

  it('o job se chama compat, com permissão só de leitura e sem segredo', () => {
    expect(workflow.jobs.compat.name).toBe('compat');
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(text).not.toContain('secrets.');
    expect(text).not.toContain('pull_request_target');
  });

  it('pina toda action por SHA', () => {
    const uses = steps.map((step) => step.uses).filter((value) => value !== undefined);
    expect(uses.filter((value) => !PINNED_ACTION.test(value))).toEqual([]);
  });

  it('executa o script compat-check', () => {
    expect(steps.map((step) => step.run ?? '').join('\n')).toContain('scripts/compat-check.ts');
  });
});
