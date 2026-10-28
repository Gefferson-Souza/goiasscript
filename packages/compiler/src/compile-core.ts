import { WARNING_CODES } from '@goiasscript/language';
import { analyze } from './analyzer/analyzer.ts';
import type { AnalysisResult } from './analyzer/analyzer.types.ts';
import type {
  CompileOptions,
  CompileTarget,
  CoreCompileFailure,
  CoreCompileResult,
  CoreCompileSuccess,
  CoreDiagnostic,
  ReplSession,
} from './api.types.ts';
import type { ParseResult } from './ast/ast.types.ts';
import { DEFAULT_FILE_NAME, INCOMPLETE_CODES, INTERNAL_ERROR_CODE } from './compile.constants.ts';
import { toCoreDiagnostic } from './diagnostics/core-report.ts';
import { createLexer } from './lexer/lexer.ts';
import type { RawDiagnostic } from './lexer/token.types.ts';
import { parse } from './parser/parser.ts';
import type { SourceText } from './source/source.types.ts';
import { createSourceText } from './source/source-text.ts';
import { buildSourceMap } from './sourcemap/source-map.ts';
import { emitProgram } from './targets/module-target.ts';

export function compileCore(text: string, options: CompileOptions = {}): CoreCompileResult {
  try {
    return compileUnsafe(text, options);
  } catch {
    return internalFailure();
  }
}

function compileUnsafe(text: string, options: CompileOptions): CoreCompileResult {
  const target = options.target ?? 'module';
  const source = createSourceText(text, options.fileName ?? DEFAULT_FILE_NAME);
  const parsed = parse(source, createLexer(source), { target });
  const analysis = analyze(parsed.program, source, { target, ...(options.session ? { session: options.session } : {}) });
  const raws = [...parsed.diagnostics, ...analysis.diagnostics].toSorted((a, b) => a.start - b.start);
  const diagnostics = raws.map((raw) => toCoreDiagnostic(raw, source));
  const errors = raws.filter((raw) => !WARNING_CODES.has(raw.code));
  if (errors.length > 0) {
    return { ok: false, diagnostics, incomplete: target === 'repl' && errors.every((raw) => INCOMPLETE_CODES.has(raw.code)) };
  }
  return buildSuccess(source, parsed, analysis, diagnostics, options, target);
}

// Sem o texto do erro técnico: a mensagem do motor seria inglês e o GS0901 já pede o relato.
function internalFailure(): CoreCompileFailure {
  const raw: RawDiagnostic = { code: INTERNAL_ERROR_CODE, start: 0, end: 0, args: {} };
  return { ok: false, diagnostics: [toCoreDiagnostic(raw, createSourceText('', DEFAULT_FILE_NAME))], incomplete: false };
}

function buildSuccess(
  source: SourceText,
  parsed: ParseResult,
  analysis: AnalysisResult,
  diagnostics: readonly CoreDiagnostic[],
  options: CompileOptions,
  target: CompileTarget,
): CoreCompileSuccess {
  const emitted = emitProgram(parsed.program, analysis, source, {
    target,
    ...(options.loopLimit === undefined ? {} : { loopLimit: options.loopLimit }),
    ...(options.session === undefined ? {} : { session: options.session }),
  });
  return {
    ok: true,
    code: emitted.code,
    diagnostics,
    helperRange: emitted.helperRange,
    map: options.sourceMap === false ? null : buildSourceMap(source, emitted.code, emitted.segments),
    session: target === 'repl' ? mergeSession(options.session, analysis) : null,
    echo: target === 'repl' && analysis.lastTopLevelExpression !== undefined,
    awaitable: emitted.awaitable,
  };
}

export function mergeSession(previous: ReplSession | undefined, analysis: AnalysisResult): ReplSession {
  const merged = [...(previous?.bindings ?? []), ...analysis.topLevelBindings];
  const bindings = new Map(merged.map((binding) => [binding.name, binding] as const));
  const members = new Set([...(previous?.members ?? []), ...analysis.declaredMembers]);
  return { bindings: [...bindings.values()], members: [...members].toSorted() };
}
