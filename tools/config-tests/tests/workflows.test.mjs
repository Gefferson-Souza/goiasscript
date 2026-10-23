import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const WORKFLOWS_DIR = path.join(ROOT_DIR, '.github/workflows');
const PINNED_ACTION = /^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/;
const VERSION_COMMENT = /#\s*v\d+\.\d+\.\d+\s*$/;
const USES_LINE = /^\s*(?:-\s+)?uses:\s*(\S+)/;
const PULL_REQUEST_TEXT = /github\.event\.pull_request\.(?:title|body)/;
const MINIMUM_PATCH_COVERAGE = '--fail-under=80';
const REQUIRED_JOBS = ['verify', 'test', 'commitlint', 'patch-coverage', 'pr-body'];
const MATRIX = { node: ['22', '24'], os: ['ubuntu-24.04', 'windows-2025'] };

const readText = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
const readYaml = (rel) => parse(readText(rel));
const workflowFiles = fs.readdirSync(WORKFLOWS_DIR).filter((name) => name.endsWith('.yml')).sort();
const stepsOf = (job) => job.steps ?? [];
const runScripts = (workflow) => Object.values(workflow.jobs).flatMap((job) => stepsOf(job).map((step) => step.run ?? ''));
const commandsOf = (job) => stepsOf(job).map((step) => step.run ?? '').join('\n');

describe.each(workflowFiles)('workflow %s', (file) => {
  const rel = `.github/workflows/${file}`;
  it('pina cada action por SHA de 40 caracteres com a versão em comentário', () => {
    const usesLines = readText(rel).split('\n').filter((line) => USES_LINE.test(line));
    const offenders = usesLines.filter((line) => !PINNED_ACTION.test(USES_LINE.exec(line)?.[1] ?? '') || !VERSION_COMMENT.test(line));
    expect(offenders).toEqual([]);
  });
  it('declara permissions mínimas no topo', () => {
    expect(readYaml(rel).permissions).toEqual({ contents: 'read' });
  });
  it('nunca interpola título nem corpo do PR no script', () => {
    expect(runScripts(readYaml(rel)).filter((script) => PULL_REQUEST_TEXT.test(script))).toEqual([]);
  });
});

describe('ci.yml', () => {
  const ci = readYaml('.github/workflows/ci.yml');
  it('define os jobs que o ruleset exige', () => {
    expect(Object.keys(ci.jobs)).toEqual(expect.arrayContaining(REQUIRED_JOBS));
  });
  it('cancela execuções antigas da mesma ref', () => {
    expect(ci.concurrency.group).toContain('github.ref');
  });
  it('roda os testes na matriz Node 22 e 24 em Ubuntu e Windows', () => {
    expect(ci.jobs.tests.strategy.matrix).toEqual(MATRIX);
  });
  it('roda o gate de idioma só no job verify, em Ubuntu', () => {
    expect(ci.jobs.verify['runs-on']).toBe('ubuntu-24.04');
    expect(commandsOf(ci.jobs.verify)).toContain('wbrazilian wamerican wbritish');
    expect(commandsOf(ci.jobs.verify)).toContain('pnpm run verify');
    expect(JSON.stringify(ci.jobs.tests)).not.toContain('rules-scan');
  });
  it('exige 80% de cobertura nas linhas alteradas', () => {
    expect(commandsOf(ci.jobs['patch-coverage'])).toContain(MINIMUM_PATCH_COVERAGE);
  });
});

describe('promises-gate.yml', () => {
  const gate = readYaml('.github/workflows/promises-gate.yml');
  it('roda o E2E do tarball em Ubuntu, Windows e macOS com Node 22 e 24', () => {
    expect(gate.jobs.tarball.strategy.matrix).toEqual({ node: ['22', '24'], os: ['ubuntu-24.04', 'windows-2025', 'macos-15'] });
    expect(gate.jobs.tarball.strategy['fail-fast']).toBe(false);
    expect(commandsOf(gate.jobs.tarball)).toContain('test:e2e');
  });
  it('limita o job do tarball com permissões mínimas, timeout e concorrência', () => {
    expect(gate.jobs.tarball.permissions).toEqual({ contents: 'read' });
    expect(gate.jobs.tarball['timeout-minutes']).toBeGreaterThan(0);
    expect(gate.jobs.tarball.concurrency['cancel-in-progress']).toBe(true);
  });
});

describe('nomes de job dos checks obrigatórios', () => {
  it('não se repetem em workflows diferentes do ci.yml', () => {
    const otherJobNames = workflowFiles
      .filter((file) => file !== 'ci.yml')
      .flatMap((file) => Object.entries(readYaml(`.github/workflows/${file}`).jobs).map(([id, job]) => job.name ?? id));
    expect(otherJobNames.filter((name) => REQUIRED_JOBS.includes(name))).toEqual([]);
  });
});

describe('demais arquivos de .github', () => {
  it('codeql analisa javascript-typescript', () => {
    expect(readText('.github/workflows/codeql.yml')).toContain('languages: javascript-typescript');
  });
  it('codeql ignora evidência e spikes pelo arquivo de configuração', () => {
    expect(readText('.github/workflows/codeql.yml')).toContain('config-file: ./.github/codeql/codeql-config.yml');
    expect(readYaml('.github/codeql/codeql-config.yml')['paths-ignore']).toEqual(['docs/auditoria', 'docs/pesquisa', 'spikes']);
  });
  it('osv lê o lockfile do pnpm', () => {
    expect(readText('.github/workflows/osv.yml')).toContain('--lockfile=pnpm-lock.yaml');
  });
  it('a rotina semanal tem exatamente um agendamento', () => {
    expect(readYaml('.github/workflows/scheduled.yml').on.schedule).toHaveLength(1);
  });
  it('dependabot cobre npm e github-actions', () => {
    expect(readYaml('.github/dependabot.yml').updates.map((update) => update['package-ecosystem'])).toEqual(['npm', 'github-actions']);
  });
  it('o template de PR tem a seção Revisão e o item de teste de regressão', () => {
    const template = readText('.github/pull_request_template.md');
    expect(template).toMatch(/^## Revisão$/m);
    expect(template).toContain('- [ ] teste de regressão incluído');
  });
});
