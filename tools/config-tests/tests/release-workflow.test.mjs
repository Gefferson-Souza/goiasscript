import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const WORKFLOW = '.github/workflows/release.yml';
const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const text = fs.readFileSync(path.join(ROOT_DIR, WORKFLOW), 'utf8');
const workflow = parse(text);
const PINNED = /@[0-9a-f]{40}$/;
const FORBIDDEN = ['NPM_TOKEN', 'NODE_AUTH_TOKEN', 'secrets.'];
const stepsOf = (job) => job.steps ?? [];
const scriptsOf = (job) => stepsOf(job).map((step) => step.run ?? '').join('\n');

describe('release.yml', () => {
  it('dispara só em push de tag alpha da linha 3', () => {
    expect(workflow.on).toEqual({ push: { tags: ['v3.*-alpha.*'] } });
  });

  it('dá só leitura por padrão e id-token apenas ao job publish', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' });
    const withIdToken = Object.entries(workflow.jobs).filter(([, job]) => job.permissions?.['id-token'] === 'write');
    expect(withIdToken.map(([id]) => id)).toEqual(['publish']);
    expect(workflow.jobs.publish.environment).toBe('npm-release');
  });

  it('não usa token de npm nem segredos', () => {
    expect(FORBIDDEN.filter((word) => text.includes(word))).toEqual([]);
  });

  it('pina toda action por sha de 40 caracteres', () => {
    const uses = Object.values(workflow.jobs).flatMap((job) => stepsOf(job).map((step) => step.uses).filter(Boolean));
    expect(uses.length).toBeGreaterThan(0);
    expect(uses.filter((value) => !PINNED.test(value))).toEqual([]);
  });

  it('encadeia pack, tarball-gate e publish', () => {
    expect(Object.keys(workflow.jobs)).toEqual(['verify', 'pack', 'tarball-gate', 'publish']);
    expect(workflow.jobs['tarball-gate'].needs).toContain('pack');
    expect(workflow.jobs.publish.needs).toContain('tarball-gate');
  });

  it('roda o gate do tarball em três sistemas', () => {
    expect(workflow.jobs['tarball-gate'].strategy.matrix.os).toHaveLength(3);
    expect(scriptsOf(workflow.jobs['tarball-gate'])).toContain('test:e2e');
  });

  it('confere o sha256 do tarball baixado antes de publicar', () => {
    const publishSteps = stepsOf(workflow.jobs.publish);
    const checkIndex = publishSteps.findIndex((step) => (step.run ?? '').includes('sha256sum'));
    const publishIndex = publishSteps.findIndex((step) => (step.run ?? '').includes('npm stage publish'));
    expect(checkIndex).toBeGreaterThanOrEqual(0);
    expect(publishIndex).toBeGreaterThan(checkIndex);
  });

  it('publica o arquivo baixado na dist-tag calculada', () => {
    const script = scriptsOf(workflow.jobs.publish);
    expect(script).toContain('release-target.ts');
    expect(script).toMatch(/npm stage publish "\$TARBALL" --tag "\$DIST_TAG"/);
  });
});
