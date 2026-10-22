import fs from 'node:fs';
import path from 'node:path';

const COMPILER_SRC = path.join(import.meta.dirname, '../packages/compiler/src');
// Cruza linhas: imports multilinha não podem deixar resíduo no .d.ts.
const IMPORT_STATEMENT = /^(?:import|export type (?:\{|\*))[^;]*?\bfrom\s+'[^']*';?[ \t]*$/gmu;

const API_SIGNATURES = `
export declare function compile(source: string, options?: CompileOptions): CompileResult;
export declare function optimize(result: CompileSuccess, options: { readonly minify: boolean }): Promise<OptimizeResult>;
export declare function explainDiagnostic(code: string, tone?: Tone): DiagnosticExplanation | null;
export declare function translateRuntimeError(error: unknown, context: RuntimeErrorContext, tone?: Tone): Diagnostic;
`;

const read = (relative: string): string => fs.readFileSync(path.join(COMPILER_SRC, relative), 'utf8');

function sourceMapVersion(): string {
  const match = /SOURCE_MAP_VERSION\s*=\s*(\d+)/u.exec(read('sourcemap/source-map.constants.ts'));
  if (match?.[1] === undefined) throw new Error('constante SOURCE_MAP_VERSION não encontrada');
  return match[1];
}

export const stripImports = (text: string): string => text.replace(IMPORT_STATEMENT, '');

export function buildDeclarations(): string {
  const sourceMap = stripImports(read('sourcemap/source-map.types.ts')).replaceAll('typeof SOURCE_MAP_VERSION', sourceMapVersion());
  const api = stripImports(read('api.types.ts'));
  const text = `${sourceMap.trim()}\n\n${api.trim()}\n${API_SIGNATURES}`;
  if (/^\s*import\b/mu.test(text)) throw new Error('as declarações da API não podem importar nada');
  return text;
}
