import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { blankLiterals, caseFiles, findOutsideV3, loadAuditCases, planCases, triageCase, writeCorpus } from '../../../scripts/import-audit-cases.ts';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
const AUDIT_DIR = path.join(ROOT_DIR, 'docs/auditoria/2026-10-13/probes-core');
const AUDIT_TOTAL = 173;
const WRITTEN_TOTAL = 168;
const BUG_GROUPS = ['aviso', 'comentario', 'estrutura', 'formato', 'identificador', 'operador-é', 'runtime', 'string', 'trocar', 'unicode', 'validacao'];
const ISSUES = Object.fromEntries(BUG_GROUPS.map((group, index) => [group, index + 1]));
const auditCases = loadAuditCases(AUDIT_DIR);
const auditCase = (id) => auditCases.find((candidate) => candidate.id === id);
const syntheticCase = (overrides) => ({ id: 'Z01', group: 'string', category: 'defeito', gs: 'uai a é 1; prosa(a);', expected: '1', ...overrides });

let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

describe('findOutsideV3', () => {
  it('termina rápido com pares de colchetes repetidos depois de uma barra', () => {
    const started = performance.now();
    findOutsideV3(`uai a é (/${'[]'.repeat(40)}`);
    expect(performance.now() - started).toBeLessThan(1000);
  });
  it('continua achando regex literal com classe de caracteres', () => {
    expect(findOutsideV3('uai a é (/[a/]b/);').map((hit) => hit.code)).toContain('GS0502');
  });
});

describe('blankLiterals', () => {
  it('mantém o tamanho e as quebras de linha e apaga palavra dentro de texto e de comentário', () => {
    const source = 'uai a é "const x"; // trem\nprosa(a);\n';
    const blanked = blankLiterals(source);
    expect(blanked).toHaveLength(source.length);
    expect(blanked.split('\n')).toHaveLength(source.split('\n').length);
    expect(blanked).not.toContain('const');
    expect(blanked).not.toContain('trem');
  });
});

describe('findOutsideV3', () => {
  it('acusa o que a v3 não aceita, com a linha certa', () => {
    expect(findOutsideV3('uai a é 1\nconsole.log(a)')).toEqual([{ code: 'GS0403', line: 2 }]);
    expect(findOutsideV3('uai a é 1\nuai b é a.length')).toEqual([{ code: 'GS0405', line: 2 }]);
    expect(findOutsideV3('uai t é `oi`')).toEqual([{ code: 'GS0501', line: 1 }]);
    expect(findOutsideV3('presta_serviço')).toEqual([{ code: 'GS0306', line: 1 }]);
  });
  it('aceita goianês válido com texto, <= e seta', () => {
    expect(findOutsideV3('uai a é "const x"\nuai b é 2 <= 3\nuai f é (x) => x\nprosa(f(b))')).toEqual([]);
  });
});

describe('triagem dos casos da auditoria', () => {
  it('classifica em intencional, bug, controle e movido', () => {
    expect(triageCase(syntheticCase({ gs: 'uai a é 1\nconsole.log(a)' }))).toEqual({ kind: 'intentional', diagnostics: [{ code: 'GS0403', line: 2 }], stdout: null });
    expect(triageCase(syntheticCase({}))).toEqual({ kind: 'bug', diagnostics: [], stdout: '1\n' });
    expect(triageCase(syntheticCase({ category: 'controle' }))).toMatchObject({ kind: 'control', stdout: '1\n' });
    expect(triageCase(auditCase('A11'))).toEqual({ kind: 'intentional', diagnostics: [{ code: 'GS0303', line: 1 }], stdout: null });
    expect(triageCase(auditCase('K07'))).toMatchObject({ kind: 'moved' });
  });
  it('lê os 173 casos, com ids únicos, e separa 168 para o corpus e 5 movidos', () => {
    const planned = planCases(auditCases);
    const countOf = (kind) => planned.filter(({ triage }) => triage.kind === kind).length;
    expect(auditCases).toHaveLength(AUDIT_TOTAL);
    expect(new Set(planned.map(({ id }) => id)).size).toBe(AUDIT_TOTAL);
    expect([countOf('intentional'), countOf('bug'), countOf('control'), countOf('moved')]).toEqual([91, 40, 37, 5]);
  });
});

describe('arquivos do caso', () => {
  it('liga o bug à issue do grupo e o intencional à RFC-0001', () => {
    const bug = auditCase('A12');
    const intentional = auditCase('A11');
    expect(JSON.parse(caseFiles(bug, triageCase(bug), ISSUES)['case.json'])).toEqual({ status: 'expected-fail', triage: 'bug', source: 'A12', issue: String(ISSUES.identificador) });
    expect(JSON.parse(caseFiles(intentional, triageCase(intentional), ISSUES)['case.json'])).toEqual({ status: 'expected-fail', triage: 'intentional', source: 'A11', rfc: 'RFC-0001' });
  });
  it('recusa bug sem a issue do grupo', () => {
    const bug = auditCase('A12');
    expect(() => caseFiles(bug, triageCase(bug), {})).toThrow(/falta a issue do grupo "identificador"/);
  });
});

describe('writeCorpus', () => {
  it('grava 168 pastas e preserva BOM, CRLF e tab do programa original', () => {
    const base = fs.mkdtempSync(path.join(os.tmpdir(), 'import-audit-'));
    temporary = [...temporary, base];
    const root = path.join(base, 'conformance');
    fs.mkdirSync(root);
    expect(writeCorpus(root, auditCases, ISSUES)).toBe(WRITTEN_TOTAL);
    expect(fs.readdirSync(root)).toHaveLength(WRITTEN_TOTAL);
    expect(fs.readFileSync(path.join(root, 'audit-l02/input.gs'), 'utf8').startsWith('﻿')).toBe(true);
    expect(fs.readFileSync(path.join(root, 'audit-l01/input.gs'), 'utf8')).toContain('\r\n');
    expect(fs.readFileSync(path.join(root, 'audit-e09/input.gs'), 'utf8')).toContain('\t');
    expect(JSON.parse(fs.readFileSync(path.join(base, 'audit-moved.json'), 'utf8')).map((entry) => entry.id)).toEqual(['K07', 'D04', 'D05', 'D06', 'D07']);
  });
});
