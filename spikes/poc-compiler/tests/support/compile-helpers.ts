import { parse } from 'acorn';
import { compile } from '../../src/compile.ts';

export function jsOf(source: string): string {
  const result = compile(source);
  if (!result.ok) throw new Error(`não compilou: ${result.diagnostics.map((d) => d.code).join(',')}`);
  return result.code;
}

export function parsesAsModule(code: string): boolean {
  try {
    parse(code, { ecmaVersion: 2022, sourceType: 'module' });
    return true;
  } catch {
    return false;
  }
}
