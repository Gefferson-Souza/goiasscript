import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { RETIRED_WORDS } from '../../../packages/language/src/index.ts';

const WORKFLOW = '.github/workflows/release.yml';
const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const text = fs.readFileSync(path.join(ROOT_DIR, WORKFLOW), 'utf8');
const workflow = parse(text);
const PINNED = /@[0-9a-f]{40}$/;
const FORBIDDEN = ['NPM_TOKEN', 'NODE_AUTH_TOKEN', 'secrets.'];
const stepsOf = (job) => job.steps ?? [];
const globToRegExp = (glob) => new RegExp(`^${glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')}$`);
const scriptsOf = (job) => stepsOf(job).map((step) => step.run ?? '').join('\n');

describe('release.yml', () => {
  it('dispara só em push de tag da linha 3, alpha ou estável', () => {
    expect(Object.keys(workflow.on)).toEqual(['push']);
    const patterns = workflow.on.push.tags;
    expect(patterns.map((pattern) => globToRegExp(pattern))).toSatisfy((regexps) => ['v3.0.0', 'v3.1.2', 'v3.0.0-alpha.1'].every((tag) => regexps.some((re) => re.test(tag))));
    expect(patterns.map((pattern) => globToRegExp(pattern)).some((re) => re.test('v2.0.0') || re.test('3.0.0'))).toBe(false);
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

  it('publica o arquivo baixado na dist-tag calculada com provenance', () => {
    const script = scriptsOf(workflow.jobs.publish);
    expect(script).toContain('release-target.ts');
    expect(script).toMatch(/npm stage publish "\$TARBALL" --tag "\$DIST_TAG" --provenance/);
  });

  it('recusa tag inválida já no job verify, antes do gate completo', () => {
    const steps = stepsOf(workflow.jobs.verify);
    const targetIndex = steps.findIndex((step) => (step.run ?? '').includes('release-target.ts'));
    const verifyIndex = steps.findIndex((step) => (step.run ?? '').includes('run verify'));
    expect(targetIndex).toBeGreaterThanOrEqual(0);
    expect(targetIndex).toBeLessThan(verifyIndex);
  });

  it('só publica commit que está na main, com histórico completo', () => {
    const publishSteps = stepsOf(workflow.jobs.publish);
    expect(publishSteps[0].with['fetch-depth']).toBe(0);
    const script = scriptsOf(workflow.jobs.publish);
    expect(script).toContain('git merge-base --is-ancestor "$GITHUB_SHA" origin/main');
  });

  it('exige um único tarball cuja versão interna bate com a da tag', () => {
    const script = scriptsOf(workflow.jobs.publish);
    expect(script).toContain('-ne 1');
    expect(script).toContain('package/package.json');
    expect(script).toContain('$EXPECTED_VERSION');
    expect(script).not.toContain('head -n 1');
  });

  it('confere o npm com stage antes de publicar', () => {
    const publishSteps = stepsOf(workflow.jobs.publish);
    const helpIndex = publishSteps.findIndex((step) => (step.run ?? '').includes('npm stage publish --help'));
    const publishIndex = publishSteps.findIndex((step) => (step.run ?? '').startsWith('npm stage publish "'));
    expect(helpIndex).toBeGreaterThanOrEqual(0);
    expect(publishIndex).toBeGreaterThan(helpIndex);
    expect(scriptsOf(workflow.jobs.publish)).toContain("grep --quiet -- '--provenance'");
  });

  it('o mesmo artefato testado nos três sistemas é o que o publish baixa', () => {
    const artifactNameOf = (job) => stepsOf(job).filter((step) => (step.uses ?? '').includes('download-artifact')).map((step) => step.with.name);
    expect(artifactNameOf(workflow.jobs['tarball-gate'])).toEqual(['cli-tarball']);
    expect(artifactNameOf(workflow.jobs.publish)).toEqual(['cli-tarball']);
    expect(scriptsOf(workflow.jobs.publish)).not.toContain('pack:cli');
  });

  it('publica só em stage, com ambiente que exige aprovação humana', () => {
    const script = scriptsOf(workflow.jobs.publish);
    expect(workflow.jobs.publish.environment).toBe('npm-release');
    expect(script).toContain('npm stage publish "$TARBALL"');
    expect(script.replace(/npm stage publish/g, '')).not.toMatch(/npm publish/);
  });

  it('calcula a dist-tag pelo script, sem fixar next', () => {
    const publishStep = stepsOf(workflow.jobs.publish).find((step) => (step.run ?? '').startsWith('npm stage publish "'));
    expect(publishStep.env.DIST_TAG).toBe('${{ steps.target.outputs.dist_tag }}');
    expect(text).not.toMatch(/--tag next/);
  });
});

describe('CHANGELOG.md', () => {
  const changelog = fs.readFileSync(path.join(ROOT_DIR, 'CHANGELOG.md'), 'utf8');
  const entry = changelog.split(/^## \[/m).find((block) => block.startsWith('3.0.0]')) ?? '';
  const section = (heading) => entry.split(new RegExp(`^### ${heading}\\s*$`, 'm'))[1]?.split(/^### /m)[0] ?? '';

  it('entrada 3.0.0 tem Removido e Alterado', () => {
    expect(section('Removido').trim()).not.toBe('');
    expect(section('Alterado').trim()).not.toBe('');
  });

  it('lista cada palavra aposentada da linguagem', () => {
    const missing = RETIRED_WORDS.filter((item) => !section('Removido').includes(`\`${item.word}\``)).map((item) => item.word);
    expect(missing).toEqual([]);
  });

  it('registra as mudanças de semântica trem e tamanho', () => {
    const changed = section('Alterado');
    expect(changed).toContain('`trem`');
    expect(changed).toContain('`let`');
    expect(changed).toContain('`.tamanho()`');
    expect(changed).toContain('`.o_tanto`');
  });

  it('abre a entrada 3.0.0 acima da 1.5.0', () => {
    expect(changelog.indexOf('## [3.0.0]')).toBeGreaterThan(-1);
    expect(changelog.indexOf('## [3.0.0]')).toBeLessThan(changelog.indexOf('## [1.5.0]'));
  });
});
