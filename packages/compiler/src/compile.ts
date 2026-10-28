import type { CompileOptions, CompileResult } from './api.types.ts';
import { compileCore } from './compile-core.ts';
import { formatCompileResult } from './diagnostics/format.ts';

export const compile = (text: string, options: CompileOptions = {}): CompileResult => formatCompileResult(compileCore(text, options), options.tone ?? 'raiz');
