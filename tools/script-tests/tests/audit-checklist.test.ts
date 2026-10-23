import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildChecklist, checklistProblems, findOrphanClosures, loadClosures, parseFindings, renderChecklist, runAuditChecklist } from '../../../scripts/audit-checklist.ts';
import { createExpectedFailPort, realChecklistFs } from '../../../scripts/audit-checklist-ports.ts';
import type { ChecklistFs, Closure, Finding } from '../../../scripts/audit-checklist.types.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const BRACKET_REPORT = ['# Relatório', '', '### [CRITICAL] F01 — Apaga o arquivo-fonte', 'texto', '### [HIGH] F02 — Sai com zero na falha', '### [MEDIUM] F03 — Detalhe menor', '### [HIGH] QA-04 — Nenhum gate é obrigatório'].join('\n');
const LIST_REPORT = ['## Achados (parte 1)', '- [HIGH] F01 Tradução por regex sobre texto inteiro (simpleTranspiler.js:68-204).', '- [MEDIUM] F13 Aviso falso em todo prosa.', '- [LOW] F28 Hash do JIT. [LOW] F29 Outro.', '- [HIGH] F02 Comentários não protegidos.'].join('\n');
const TEST_FILE = 'packages/x/tests/a.test.ts';
const files: Readonly<Record<string, string>> = {
  [TEST_FILE]: "describe('grupo', () => {\n  it('apaga com segurança', () => {});\n});\n// it('só em comentário', () => {})\n",
  'docs/adr/0001-x.md': '# ADR-0001',
  'packages/compiler/tests/conformance/golden-one/diagnostics.json': '[]',
};
const memory: ChecklistFs = { exists: (file) => file in files, read: (file) => files[file] ?? '' };
const finding = (id: string, severity: Finding['severity'] = 'HIGH'): Finding => ({ id, severity, title: `achado ${id}`, report: 'B-x.md' });
const testClosure = (id: string, overrides: Partial<Closure> = {}): Closure => ({ id, kind: 'test', ref: TEST_FILE, testName: 'apaga com segurança', ...overrides });

describe('parseFindings', () => {
  it('lê achados no formato de título com colchetes', () => {
    const found = parseFindings(BRACKET_REPORT, 'B-cli-repl-pacote.md');
    expect(found.map((item) => [item.id, item.severity, item.title])).toEqual([
      ['B F01', 'CRITICAL', 'Apaga o arquivo-fonte'],
      ['B F02', 'HIGH', 'Sai com zero na falha'],
      ['B QA-04', 'HIGH', 'Nenhum gate é obrigatório'],
    ]);
    expect(found.every((item) => item.report === 'B-cli-repl-pacote.md')).toBe(true);
  });

  it('lê achados do relatório A (outro formato)', () => {
    const found = parseFindings(LIST_REPORT, 'A-nucleo-compilador.md');
    expect(found.map((item) => [item.id, item.severity])).toEqual([['A F01', 'HIGH'], ['A F02', 'HIGH']]);
    expect(found[0]?.title).toContain('Tradução por regex');
  });

  it('relatório sem nenhum achado reconhecido não passa em silêncio', () => {
    expect(parseFindings('# vazio\nsó prosa', 'C-x.md')).toEqual([]);
    const problems = checklistProblems({ rows: [], orphans: [], emptyReports: ['C-x.md'], expectedFail: [] });
    expect(problems.map((item) => item.file).join(' ')).toContain('C-x.md');
  });
});

describe('buildChecklist', () => {
  it('fechamento com arquivo e título existentes deixa o achado closed', () => {
    const [row] = buildChecklist([finding('B F01', 'CRITICAL')], [testClosure('B F01')], memory);
    expect(row).toMatchObject({ state: 'closed', reasons: [] });
  });

  it('achado sem fechamento é open e falha', () => {
    const rows = buildChecklist([finding('B F02')], [], memory);
    expect(rows[0]?.state).toBe('open');
    const problems = checklistProblems({ rows, orphans: [], emptyReports: [], expectedFail: [] });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('B F02');
  });

  it('fechamento com arquivo inexistente falha', () => {
    const rows = buildChecklist([finding('B F02')], [testClosure('B F02', { ref: 'nao/existe.test.ts' })], memory);
    expect(rows[0]?.state).toBe('open');
    expect(rows[0]?.reasons.join(' ')).toContain('nao/existe.test.ts');
  });

  it('fechamento com nome de teste ausente falha', () => {
    const rows = buildChecklist([finding('B F02')], [testClosure('B F02', { testName: 'outro nome' })], memory);
    expect(rows[0]?.state).toBe('open');
    expect(rows[0]?.reasons.join(' ')).toContain('outro nome');
  });

  it('nome que só aparece em comentário não vale como título', () => {
    const rows = buildChecklist([finding('B F02')], [testClosure('B F02', { testName: 'só em comentário' })], memory);
    expect(rows[0]?.state).toBe('open');
  });

  it('teste sem testName exige só o arquivo, mas intentional exige o golden e adr exige o ADR', () => {
    const intentional: Closure = { id: 'B F02', kind: 'intentional', ref: 'packages/compiler/tests/conformance/golden-one' };
    const adr: Closure = { id: 'B F02', kind: 'adr', ref: 'docs/adr/0001-x.md' };
    expect(buildChecklist([finding('B F02')], [intentional], memory)[0]?.state).toBe('closed');
    expect(buildChecklist([finding('B F02')], [adr], memory)[0]?.state).toBe('closed');
    expect(buildChecklist([finding('B F02')], [{ ...intentional, ref: 'packages/compiler/tests/conformance/falta' }], memory)[0]?.state).toBe('open');
    expect(buildChecklist([finding('B F02')], [{ ...adr, ref: 'docs/adr/9999-falta.md' }], memory)[0]?.state).toBe('open');
  });

  it('intentional fora do corpus de conformidade e adr fora de docs/adr são recusados', () => {
    const outside: Closure = { id: 'B F02', kind: 'intentional', ref: TEST_FILE };
    const wrongAdr: Closure = { id: 'B F02', kind: 'adr', ref: TEST_FILE };
    expect(buildChecklist([finding('B F02')], [outside], memory)[0]?.state).toBe('open');
    expect(buildChecklist([finding('B F02')], [wrongAdr], memory)[0]?.state).toBe('open');
  });

  it('um fechamento ruim entre vários mantém o achado open', () => {
    const rows = buildChecklist([finding('B F02')], [testClosure('B F02'), testClosure('B F02', { ref: 'falta.ts' })], memory);
    expect(rows[0]?.state).toBe('open');
  });

  it('fechamento de achado que não existe é órfão e falha', () => {
    const orphans = findOrphanClosures([finding('B F02')], [testClosure('B F99')]);
    expect(orphans).toEqual(['B F99']);
    expect(checklistProblems({ rows: [], orphans, emptyReports: [], expectedFail: [] })[0]?.message).toContain('B F99');
  });
});

describe('expected-fail no corpus', () => {
  it('expected-fail no corpus falha', () => {
    const problems = checklistProblems({ rows: [], orphans: [], emptyReports: [], expectedFail: ['audit-a01'] });
    expect(problems).toHaveLength(1);
    expect(problems[0]?.message).toContain('audit-a01');
  });

  it('o corpus real não tem nenhum caso expected-fail', () => {
    expect(createExpectedFailPort(ROOT_DIR).list()).toEqual([]);
  });
});

describe('renderChecklist', () => {
  it('gera a tabela em Markdown com estado e fechamento', () => {
    const rows = buildChecklist([finding('B F01', 'CRITICAL'), finding('B F02')], [testClosure('B F01')], memory);
    const text = renderChecklist(rows);
    expect(text).toContain('| B F01 | CRITICAL |');
    expect(text).toContain(TEST_FILE);
    expect(text).toMatch(/\| B F02 \| HIGH \|.*\| open \|/u);
  });
});

describe('checklist real dos relatórios A a E', () => {
  const real = realChecklistFs(ROOT_DIR);
  const run = (): { out: string; err: string; code: number } => {
    const captured = { out: '', err: '' };
    const code = runAuditChecklist(ROOT_DIR, { out: (text) => (captured.out += text), err: (text) => (captured.err += text) }, createExpectedFailPort(ROOT_DIR));
    return { ...captured, code };
  };

  it('todo CRITICAL e HIGH dos relatórios A a E tem fechamento verificável', () => {
    const result = run();
    expect(result.err).toBe('');
    expect(result.code).toBe(0);
    expect(result.out.split('\n').filter((line) => /^\| [A-E] /u.test(line))).toHaveLength(46);
    expect(result.out).not.toMatch(/\| open \|/u);
  });

  it('os dois CRITICAL apontam para os testes da §8.2', () => {
    const closures = loadClosures(real);
    const refs = (id: string): readonly string[] => closures.filter((item) => item.id === id).map((item) => item.ref);
    expect(refs('B F01')).toContain('packages/cli/tests/e2e/name-matrix.e2e.ts');
    expect(refs('E F01')).toContain('packages/vscode/tests/integration/hostile-names.test.ts');
  });

  it('não sobra fechamento sem achado', () => {
    const closures = loadClosures(real);
    const ids = new Set(closures.map((item) => item.id));
    expect(ids.size).toBe(46);
  });
});
