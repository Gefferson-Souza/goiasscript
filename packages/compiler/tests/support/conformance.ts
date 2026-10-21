import fs from 'node:fs';
import path from 'node:path';
import { expect } from 'vitest';
import type { ActualDiagnostic, BlessedFiles, CaseConfig, CompileFunction, ConformanceCase, ExecuteFunction, ExpectedDiagnostic } from './conformance.types.ts';

const readOptional = (file: string): string | null => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

function toDiagnostic(value: unknown): ExpectedDiagnostic {
  if (!isRecord(value) || typeof value['code'] !== 'string' || typeof value['line'] !== 'number') throw new Error(`diagnóstico inválido no golden: ${JSON.stringify(value)}`);
  const { code, line, column, severity } = value;
  return { code, line, ...(typeof column === 'number' ? { column } : {}), ...(severity === 'error' || severity === 'warning' ? { severity } : {}) };
}

function parseConfig(text: string | null): CaseConfig {
  const parsed: unknown = text === null ? {} : JSON.parse(text);
  if (!isRecord(parsed)) throw new Error('case.json precisa ser um objeto');
  if (parsed['status'] === 'expected-fail' && typeof parsed['rfc'] !== 'string' && typeof parsed['issue'] !== 'string') throw new Error('expected-fail exige rfc ou issue no case.json');
  return parsed;
}

export function loadCase(root: string, id: string): ConformanceCase {
  const dir = path.join(root, id);
  const diagnostics: unknown = JSON.parse(readOptional(path.join(dir, 'diagnostics.json')) ?? 'null');
  if (!Array.isArray(diagnostics)) throw new Error(`caso ${id} sem diagnostics.json com uma lista`);
  return {
    id,
    input: fs.readFileSync(path.join(dir, 'input.gs'), 'utf8'),
    config: parseConfig(readOptional(path.join(dir, 'case.json'))),
    diagnostics: diagnostics.map(toDiagnostic),
    output: readOptional(path.join(dir, 'output.mjs')),
    stdout: readOptional(path.join(dir, 'stdout.txt')),
    stdin: readOptional(path.join(dir, 'stdin.txt')),
  };
}

export function loadCases(root: string): readonly ConformanceCase[] {
  return fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort().map((id) => loadCase(root, id));
}

// Coluna e severidade só entram na comparação quando o golden as traz.
function project(actual: ActualDiagnostic, template?: ExpectedDiagnostic): ExpectedDiagnostic {
  return {
    code: actual.code,
    line: actual.range.start.line,
    ...(template?.column === undefined ? {} : { column: actual.range.start.column }),
    ...(template?.severity === undefined ? {} : { severity: actual.severity }),
  };
}

export async function runCase(testCase: ConformanceCase, compile: CompileFunction, execute: ExecuteFunction): Promise<void> {
  const result = compile(testCase.input);
  expect(result.diagnostics.map((diagnostic, index) => project(diagnostic, testCase.diagnostics[index]))).toEqual(testCase.diagnostics);
  if (!result.ok) {
    expect(testCase.output).toBeNull();
    expect(testCase.stdout).toBeNull();
    return;
  }
  if (testCase.output !== null) expect(result.code).toBe(testCase.output);
  if (testCase.stdout !== null) expect(await execute(result.code, testCase.stdin)).toBe(testCase.stdout);
}

export async function blessCase(testCase: ConformanceCase, compile: CompileFunction, execute: ExecuteFunction): Promise<BlessedFiles> {
  const result = compile(testCase.input);
  const diagnostics = result.diagnostics.map((d) => ({ code: d.code, severity: d.severity, line: d.range.start.line, column: d.range.start.column }));
  const stdout = result.ok && testCase.stdout !== null ? await execute(result.code, testCase.stdin) : testCase.stdout;
  return { output: result.ok ? result.code : null, diagnostics: `${JSON.stringify(diagnostics, null, 2)}\n`, stdout };
}

export function pickCompile(moduleExports: object): CompileFunction {
  const candidate = (moduleExports as Record<string, unknown>)['compile'];
  if (typeof candidate !== 'function') throw new Error('compile() ainda não existe em @goiasscript/compiler');
  return candidate as CompileFunction;
}
