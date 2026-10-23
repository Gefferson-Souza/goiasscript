import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const ADR_DIR = path.join(ROOT_DIR, 'docs/adr');
const ADR_COUNT = 11;
const ADR_FULL_FORMAT_FROM = 2;
const ADR_SECTIONS = ['Contexto', 'Decisão', 'Consequências', 'Confirmação'];
const RFC_SECTIONS = ['Resumo', 'Motivação', 'Delta de EBNF', 'Exemplos', 'Notas de migração', 'Casos de conformidade', 'Revisão'];
const RFC_STATUSES = 'rascunho | proposto | aceito | implementado | lançado';
const STATUS_LINE = /^- (?:\*\*)?Status:(?:\*\*)? (?:proposto|aceito)/m;

const readDoc = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
const sectionBody = (text, heading) => text.split(new RegExp(`^## ${heading}\\s*$`, 'm'))[1]?.split(/^## /m)[0]?.trim() ?? '';
const adrFiles = fs.readdirSync(ADR_DIR).filter((name) => /^\d{4}-.+\.md$/.test(name)).sort();
const expectedNumbers = Array.from({ length: ADR_COUNT }, (_unused, index) => String(index + 1).padStart(4, '0'));

describe('docs/adr', () => {
  it('numera os ADRs de 0001 a 0011, um arquivo por número', () => {
    expect(adrFiles.map((name) => name.slice(0, 4))).toEqual(expectedNumbers);
  });
  describe.each(adrFiles)('%s', (file) => {
    const text = readDoc(`docs/adr/${file}`);
    const number = file.slice(0, 4);
    it('tem título com o número e uma linha de status', () => {
      expect(text.startsWith(`# ADR-${number}: `)).toBe(true);
      expect(text).toMatch(STATUS_LINE);
    });
    it('tem as seções preenchidas', () => {
      const required = Number(number) < ADR_FULL_FORMAT_FROM ? ['Decisão'] : ADR_SECTIONS;
      expect(required.filter((heading) => sectionBody(text, heading) === '')).toEqual([]);
    });
  });
});

describe('docs/rfc e docs/spec', () => {
  it('o template de RFC tem as sete seções e o ciclo de status', () => {
    const template = readDoc('docs/rfc/rfc.md');
    expect(RFC_SECTIONS.filter((heading) => sectionBody(template, heading) === '')).toEqual([]);
    expect(template).toContain(RFC_STATUSES);
  });
  it('o spec tem a página de migração e a de mudanças', () => {
    expect(readDoc('docs/spec/migracao.md').startsWith('# Migração entre versões')).toBe(true);
    expect(readDoc('docs/spec/o-que-mudou.md').startsWith('# O que mudou')).toBe(true);
  });
});

describe('docs/spec final', () => {
  const SPEC_FILES = ['gramatica.md', 'migracao.md', 'o-que-mudou.md', 'referencia.md', 'vocabulario.lock.json'];
  const GRAMMAR_ID = /^(?:## )?(G\d{2})\b/gmu;
  const RETIRED_WORD = /word: '([^']+)'/gu;
  const tableRows = (text) => text.split('\n').filter((line) => line.startsWith('| ') && line.includes('`'));
  it('docs/spec tem os cinco arquivos esperados', () => {
    expect(fs.readdirSync(path.join(ROOT_DIR, 'docs/spec')).sort()).toEqual(SPEC_FILES);
  });
  it('ids Gnn da gramática são únicos', () => {
    const ids = [...readDoc('docs/spec/gramatica.md').matchAll(GRAMMAR_ID)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
  });
  it('toda palavra aposentada aparece em migracao.md ou em o-que-mudou.md', () => {
    const retired = [...readDoc('packages/language/src/retired/retired-words.data.ts').matchAll(RETIRED_WORD)].map((match) => match[1]);
    const rows = [...tableRows(readDoc('docs/spec/migracao.md')), ...tableRows(readDoc('docs/spec/o-que-mudou.md'))].join('\n');
    expect(retired.length).toBeGreaterThan(0);
    expect(retired.filter((word) => !rows.includes(`\`${word}\``))).toEqual([]);
  });
  it('migracao.md registra a troca de trem e de .tamanho()', () => {
    const rows = tableRows(readDoc('docs/spec/migracao.md')).join('\n');
    expect(rows).toContain('`trem`');
    expect(rows).toContain('`.tamanho()`');
  });
});

describe('docs/piloto', () => {
  const PILOT_DIR = path.join(ROOT_DIR, 'docs/piloto');
  const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/u;
  const ABSOLUTE_PATH = /(?:^|[\s("'`])(?:\/(?:home|Users|root)\/|[A-Za-z]:\\)/mu;
  const PHONE = /(?:\+?\d{2}\s?)?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}/u;
  const LEARNER_NAME = /(?:aprendiz|participante|aluno)\s+(?:[A-ZÀ-Ý][a-zà-ÿ]+)\b/u;
  const listFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      return entry.isDirectory() ? listFiles(full) : [full];
    });
  const pilotFiles = listFiles(PILOT_DIR);

  it('traz os quatro documentos do kit e a pasta das respostas', () => {
    const names = pilotFiles.map((file) => path.relative(PILOT_DIR, file).split(path.sep).join('/'));
    expect(names).toEqual(expect.arrayContaining(['README.md', 'roteiro.md', 'formulario-retorno.md', 'modelo-relatorio.md', 'respostas/.gitkeep']));
  });

  it('docs/piloto não tem e-mail, caminho absoluto, telefone nem nome próprio de aprendiz', () => {
    const offenders = pilotFiles.flatMap((file) => {
      const text = fs.readFileSync(file, 'utf8');
      return [EMAIL, ABSOLUTE_PATH, PHONE, LEARNER_NAME].filter((pattern) => pattern.test(text)).map((pattern) => `${path.relative(ROOT_DIR, file)}: ${String(pattern)}`);
    });
    expect(offenders).toEqual([]);
  });
});

describe('porta de entrada da comunidade', () => {
  const EMAIL = /[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/u;
  const PLANNING_REFERENCE = /Discussions|PLANO-RELANCAMENTO|docs\/plano|superpowers|KEEP-OR-ARCHIVE/u;
  const ENTRY_DOCS = ['CONTRIBUTING.md', 'README.md', 'SECURITY.md', 'CODE_OF_CONDUCT.md'];
  const TEMPLATES = ['bug_report.md', 'feature_request.md', 'rfc.md'].map((name) => `.github/ISSUE_TEMPLATE/${name}`);
  const PNPM_BUILTINS = new Set(['install', 'exec', 'dlx', 'add']);
  const COMMAND_NAME = /^\s+(?:id: '[^']+', )?name: '([^']+)'(?:, asciiName: '([^']+)')?/gmu;
  const cliCommands = new Set([...readDoc('packages/cli/src/args/commands.data.ts').matchAll(COMMAND_NAME)].flatMap((match) => [match[1], match[2]].filter(Boolean)));
  const scripts = new Set(Object.keys(JSON.parse(readDoc('package.json')).scripts));

  it('CONTRIBUTING não cita Discussions nem planejamento', () => {
    expect(readDoc('CONTRIBUTING.md')).not.toMatch(PLANNING_REFERENCE);
  });

  it('CONTRIBUTING cobre RFC, mantenedor único, fora da v3, commits e merge', () => {
    const text = readDoc('CONTRIBUTING.md');
    for (const expected of ['docs/rfc/rfc.md', 'sem prazo', 'docs/adr/0010-fora-da-v3.md', 'docs/adr/0008-commits.md', 'docs/adr/0011-fluxo-de-pr-e-historico.md']) {
      expect(text).toContain(expected);
    }
  });

  it('todo script pnpm citado em CONTRIBUTING e README existe no package.json', () => {
    const cited = [...ENTRY_DOCS, ...TEMPLATES].flatMap((file) => [...readDoc(file).matchAll(/corepack pnpm (?:run\s+)?([a-z][\w:-]*)/gu)].map((match) => match[1]));
    expect(cited.length).toBeGreaterThan(0);
    expect(cited.filter((name) => !scripts.has(name) && !PNPM_BUILTINS.has(name))).toEqual([]);
  });

  it('todo comando goiasscript citado em código inline existe no CLI', () => {
    const cited = [...ENTRY_DOCS, ...TEMPLATES].flatMap((file) => [...readDoc(file).matchAll(/(?<!`)`goiasscript[ \t]+([^\s`]+)[^`\n]*`(?!`)/gu)].map((match) => match[1]));
    expect(cited.length).toBeGreaterThan(0);
    expect(cited.filter((name) => !cliCommands.has(name))).toEqual([]);
  });

  it('SECURITY e CODE_OF_CONDUCT não têm e-mail e apontam o reporte privado do GitHub', () => {
    for (const file of [...ENTRY_DOCS, ...TEMPLATES]) expect(readDoc(file)).not.toMatch(EMAIL);
    expect(readDoc('SECURITY.md')).toMatch(/reporte privado/u);
    expect(readDoc('CODE_OF_CONDUCT.md')).toMatch(/perfil/u);
  });

  it('templates de issue existem e config.yml desliga issue em branco', () => {
    for (const template of TEMPLATES) expect(fs.existsSync(path.join(ROOT_DIR, template))).toBe(true);
    expect(readDoc('.github/ISSUE_TEMPLATE/config.yml')).toMatch(/^blank_issues_enabled: false$/mu);
    expect(readDoc('.github/ISSUE_TEMPLATE/bug_report.md')).toContain('pnpm');
    for (const template of TEMPLATES) expect(readDoc(template)).not.toMatch(PLANNING_REFERENCE);
  });

  it('README declara a política não faz parte da v3', () => {
    expect(readDoc('README.md')).toMatch(/não faz parte da v3/u);
  });

  it('README e CONTRIBUTING não têm marcador AUTO-GENERATED sem gerador', () => {
    expect(readDoc('README.md')).not.toContain('AUTO-GENERATED');
    expect(readDoc('CONTRIBUTING.md')).not.toContain('AUTO-GENERATED');
  });
});

describe('docs/operacao.md', () => {
  const OPERATION_SECTIONS = [
    'Rotacionar a chave da Groq',
    'Acionar e desligar o kill switch',
    'Republicar a extensão',
    'Deprecar versão e mexer nas dist-tags',
    'Recriar o trusted publisher expirado',
    'Reverter o deploy do playground',
    'Aquecer o cache do Engoianador',
    'Rodar contrato e smoke',
  ];
  const WORKSPACE_ROOTS = ['apps', 'packages', 'tools'];
  const PNPM_COMMAND = /\bpnpm((?:\s+--filter\s+\S+)?)\s+(run\s+)?([a-z][\w:-]*)/gu;
  const PNPM_NON_SCRIPTS = new Set(['exec', 'install', 'add', 'dlx', 'audit']);
  const PNPM_NATIVE_COMMANDS = new Set(['deploy', 'publish', 'pack', 'link', 'update', 'remove', 'rebuild', 'prune', 'fetch', 'patch', 'stage']);
  const WORKFLOW_FILE = /\.github\/workflows\/([\w.-]+\.yml)/gu;
  const FILE_REFERENCE = /`((?:apps|packages|scripts|tools|docs)\/[\w./-]+\.(?:ts|mjs|toml|md|json))`/gu;

  const operation = readDoc('docs/operacao.md');
  const readScripts = (dir) => JSON.parse(fs.readFileSync(path.join(ROOT_DIR, dir, 'package.json'), 'utf8')).scripts ?? {};
  const workspaces = WORKSPACE_ROOTS.flatMap((root) =>
    fs
      .readdirSync(path.join(ROOT_DIR, root), { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && fs.existsSync(path.join(ROOT_DIR, root, entry.name, 'package.json')))
      .map((entry) => `${root}/${entry.name}`),
  );
  const scriptsByPackageName = new Map(
    workspaces.map((dir) => [JSON.parse(readDoc(`${dir}/package.json`)).name, readScripts(dir)]),
  );
  const rootScripts = readScripts('.');

  it('tem as oito seções do runbook, cada uma preenchida', () => {
    expect(OPERATION_SECTIONS.filter((heading) => sectionBody(operation, heading) === '')).toEqual([]);
  });

  it('todo script pnpm citado existe no package.json', () => {
    const missing = [...operation.matchAll(PNPM_COMMAND)]
      .filter(([, , , script]) => !PNPM_NON_SCRIPTS.has(script))
      .filter(([, filter, , script]) => {
        const packageName = filter.trim().split(/\s+/u)[1];
        const scripts = packageName === undefined ? rootScripts : scriptsByPackageName.get(packageName);
        return scripts?.[script] === undefined;
      })
      .map(([command]) => command);
    expect(missing).toEqual([]);
  });

  it('comando nativo do pnpm só aparece com run, para executar o script do pacote', () => {
    const shadowed = [...operation.matchAll(PNPM_COMMAND)]
      .filter(([, , runKeyword, script]) => runKeyword === undefined && PNPM_NATIVE_COMMANDS.has(script))
      .map(([command]) => command);
    expect(shadowed).toEqual([]);
  });

  it('scripts da raiz não chamam comando nativo do pnpm sem run', () => {
    const shadowed = Object.entries(rootScripts)
      .filter(([, body]) => [...body.matchAll(PNPM_COMMAND)].some(([, , runKeyword, script]) => runKeyword === undefined && PNPM_NATIVE_COMMANDS.has(script)))
      .map(([name]) => name);
    expect(shadowed).toEqual([]);
  });

  it('deixa claro que o stage do npm precisa de aprovação manual com 2FA', () => {
    const release = sectionBody(operation, 'Deprecar versão e mexer nas dist-tags') + sectionBody(operation, 'Recriar o trusted publisher expirado');
    expect(release).toContain('npm stage approve');
    expect(release).toMatch(/2FA/u);
    expect(release).toMatch(/latest/u);
  });

  it('cita ao menos um script pnpm', () => {
    expect([...operation.matchAll(PNPM_COMMAND)].length).toBeGreaterThan(0);
  });

  it('todo workflow citado existe em .github/workflows', () => {
    const cited = [...operation.matchAll(WORKFLOW_FILE)].map(([, file]) => file);
    expect(cited.length).toBeGreaterThan(0);
    expect(cited.filter((file) => !fs.existsSync(path.join(ROOT_DIR, '.github/workflows', file)))).toEqual([]);
  });

  it('todo arquivo do repositório citado existe', () => {
    const cited = [...operation.matchAll(FILE_REFERENCE)].map(([, file]) => file);
    expect(cited.length).toBeGreaterThan(0);
    expect(cited.filter((file) => !fs.existsSync(path.join(ROOT_DIR, file)))).toEqual([]);
  });

  it('não tem e-mail nem caminho absoluto da máquina', () => {
    expect(operation).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/u);
    expect(operation).not.toMatch(/(?:^|[\s("'`])(?:\/(?:home|Users|root)\/|[A-Za-z]:\\)/mu);
  });
});
