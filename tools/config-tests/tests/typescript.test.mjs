import path from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const raw = ts.readConfigFile(path.join(ROOT, 'tsconfig.base.json'), ts.sys.readFile).config.compilerOptions;
const { options } = ts.convertCompilerOptionsFromJson(raw, ROOT);
const FILE = path.join(ROOT, 'packages/language/src/virtual.ts');

function codes(source) {
  const host = ts.createCompilerHost(options);
  const original = host.getSourceFile.bind(host);
  host.getSourceFile = (name, ...rest) => (name === FILE ? ts.createSourceFile(name, source, options.target ?? ts.ScriptTarget.ES2023) : original(name, ...rest));
  return ts.getPreEmitDiagnostics(ts.createProgram([FILE], options, host)).map((d) => d.code);
}

describe('tsconfig.base.json', () => {
  it('erro de catch é unknown', () => { expect(codes('export function f(g: () => void): string {\n  try {\n    g();\n  } catch (error) {\n    return error.message;\n  }\n  return "";\n}\n')).toContain(18046); });
  it('noUncheckedIndexedAccess', () => { expect(codes('const list: number[] = [];\nexport const first: number = list[0];\n')).toContain(2322); });
  it('exactOptionalPropertyTypes', () => { expect(codes('export const entry: { readonly a?: number } = { a: undefined };\n')).toContain(2375); });
  it('erasableSyntaxOnly', () => { expect(codes('export enum Color {\n  Red,\n}\n')).toContain(1294); });
  it('strict', () => { expect(codes('export function f(value) {\n  return value;\n}\n')).toContain(7006); });
  it('aceita código correto', () => { expect(codes('export const value = 1;\n')).toEqual([]); });
});
