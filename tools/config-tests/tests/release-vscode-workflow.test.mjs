import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const read = (file) => fs.readFileSync(path.join(ROOT_DIR, '.github/workflows', file), 'utf8');
const text = read('release-vscode.yml');
const workflow = parse(text);
const PINNED = /@[0-9a-f]{40}$/;
const stepsOf = (job) => job.steps ?? [];
const scriptsOf = (job) => stepsOf(job).map((step) => step.run ?? '').join('\n');
const jobsWith = (predicate) => Object.entries(workflow.jobs).filter(([, job]) => predicate(job)).map(([id]) => id);
const needsOf = (job) => [job.needs ?? []].flat();

describe('release-vscode.yml', () => {
  it('dispara só em push de tag vscode-v*', () => {
    expect(workflow.on).toEqual({ push: { tags: ['vscode-v*'] } });
  });

  it('dá só leitura por padrão e id-token apenas ao job de Marketplace', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
    expect(jobsWith((job) => job.permissions?.['id-token'] === 'write')).toEqual(['publish-marketplace']);
    expect(workflow.jobs['publish-marketplace'].environment).toBe('marketplace');
    expect(workflow.jobs['publish-openvsx'].environment).toBe('open-vsx');
  });

  it('usa segredo uma única vez, no env do passo que publica no Open VSX', () => {
    expect(text.match(/secrets\./g)).toHaveLength(1);
    const holders = stepsOf(workflow.jobs['publish-openvsx']).filter((step) => JSON.stringify(step.env ?? {}).includes('secrets.'));
    expect(holders).toHaveLength(1);
    expect(holders[0].run).toContain('ovsx');
    expect(text).not.toContain('VSCE_PAT');
  });

  it('pina toda action por sha de 40 caracteres', () => {
    const uses = Object.values(workflow.jobs).flatMap((job) => stepsOf(job).map((step) => step.uses).filter(Boolean));
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((value) => !PINNED.test(value))).toEqual([]);
  });

  it('encadeia verify, package, integration e os dois publish', () => {
    expect(Object.keys(workflow.jobs)).toEqual(['verify', 'package', 'integration', 'publish-marketplace', 'publish-openvsx']);
    expect(needsOf(workflow.jobs.package)).toContain('verify');
    expect(needsOf(workflow.jobs.integration)).toContain('package');
    expect(needsOf(workflow.jobs['publish-marketplace'])).toContain('integration');
    expect(needsOf(workflow.jobs['publish-openvsx'])).toContain('integration');
  });

  it('roda a integração em três sistemas sobre o vsix baixado', () => {
    const job = workflow.jobs.integration;
    expect(job.strategy.matrix.os).toHaveLength(3);
    expect(stepsOf(job).some((step) => step.uses?.includes('download-artifact'))).toBe(true);
    expect(scriptsOf(job)).toContain('test:integration');
  });

  it.each(['publish-marketplace', 'publish-openvsx'])('%s confere o sha256 do vsix baixado e o commit da tag na main', (id) => {
    const job = workflow.jobs[id];
    const script = scriptsOf(job);
    expect(script).toContain('sha256sum --check --strict');
    expect(script).toContain('git merge-base --is-ancestor "$GITHUB_SHA" origin/main');
    expect(stepsOf(job).find((step) => step.uses?.includes('checkout')).with['fetch-depth']).toBe(0);
    expect(stepsOf(job).some((step) => step.uses?.includes('download-artifact'))).toBe(true);
  });

  it('confere o sha256 antes de publicar', () => {
    ['publish-marketplace', 'publish-openvsx'].forEach((id) => {
      const steps = stepsOf(workflow.jobs[id]);
      const checkIndex = steps.findIndex((step) => (step.run ?? '').includes('sha256sum'));
      const publishIndex = steps.findIndex((step) => (step.run ?? '').includes(' publish '));
      expect(checkIndex).toBeGreaterThanOrEqual(0);
      expect(publishIndex).toBeGreaterThan(checkIndex);
    });
  });

  it('publica no Marketplace o vsix do artefato por credencial do Azure, com pré-lançamento condicionado', () => {
    const script = scriptsOf(workflow.jobs['publish-marketplace']);
    expect(script).toMatch(/@vscode\/vsce@\d+\.\d+\.\d+ publish/);
    expect(script).toContain('--packagePath');
    expect(script).toContain('--azure-credential');
    expect(script).toContain('--pre-release');
    expect(scriptsOf(workflow.jobs['publish-marketplace'])).toContain('PRE_RELEASE');
    expect(stepsOf(workflow.jobs['publish-marketplace']).some((step) => step.uses?.startsWith('azure/login@'))).toBe(true);
  });

  it('publica no Open VSX o mesmo vsix, com versão exata da ferramenta', () => {
    const script = scriptsOf(workflow.jobs['publish-openvsx']);
    expect(script).toMatch(/ovsx@\d+\.\d+\.\d+ publish/);
    expect(script).toContain('--pre-release');
    expect(script).toContain('PRE_RELEASE');
  });

  it('o job package calcula o alvo e guarda vsix e sha256 num artefato', () => {
    const job = workflow.jobs.package;
    expect(scriptsOf(job)).toContain('release-target-vscode.ts');
    expect(scriptsOf(job)).toContain('pack:vscode');
    expect(job.outputs).toHaveProperty('pre_release');
  });

  it('exige um único vsix cuja versão bate com a da tag', () => {
    const script = scriptsOf(workflow.jobs.package);
    expect(script).toContain('-ne 1');
  });
});

describe('smoke-extension.yml', () => {
  const smoke = parse(read('smoke-extension.yml'));

  it('só dispara à mão e não usa segredo', () => {
    expect(Object.keys(smoke.on)).toEqual(['workflow_dispatch']);
    expect(read('smoke-extension.yml')).not.toContain('secrets.');
    expect(smoke.permissions).toEqual({ contents: 'read' });
  });

  it('roda o script de smoke com actions pinadas', () => {
    const jobs = Object.values(smoke.jobs);
    expect(jobs.flatMap(stepsOf).map((step) => step.run ?? '').join('\n')).toContain('smoke-extension.ts');
    expect(jobs.flatMap(stepsOf).map((step) => step.uses).filter(Boolean).filter((value) => !PINNED.test(value))).toEqual([]);
  });
});
