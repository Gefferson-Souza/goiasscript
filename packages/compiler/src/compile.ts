import { lookupDiagnostic } from '@goiasscript/language';
import { analyze } from './analyzer/analyzer.ts';
import type { AnalysisResult } from './analyzer/analyzer.types.ts';
import type {
  CompileFailure,
  CompileOptions,
  CompileResult,
  CompileSuccess,
  CompileTarget,
  Diagnostic,
  ReplSession,
  Severity,
  Tone,
} from './api.types.ts';
import type { ParseResult } from './ast/ast.types.ts';
import { DEFAULT_FILE_NAME, INCOMPLETE_CODES, INTERNAL_ERROR_CODE } from './compile.constants.ts';
import { toDiagnostic } from './diagnostics/report.ts';
import { createLexer } from './lexer/lexer.ts';
import type { RawDiagnostic } from './lexer/token.types.ts';
import { parse } from './parser/parser.ts';
import type { SourceText } from './source/source.types.ts';
import { createSourceText } from './source/source-text.ts';
import { buildSourceMap } from './sourcemap/source-map.ts';
import { emitProgram } from './targets/module-target.ts';

const severityOf = (code: string): Severity => lookupDiagnostic(code)?.severity ?? 'error';

export function compile(text: string, options: CompileOptions = {}): CompileResult {
  const tone = options.tone ?? 'raiz';
  try {
    return compileUnsafe(text, options, tone);
  } catch {
    return internalFailure(tone);
  }
}

function compileUnsafe(text: string, options: CompileOptions, tone: Tone): CompileResult {
  const target = options.target ?? 'module';
  const source = createSourceText(text, options.fileName ?? DEFAULT_FILE_NAME);
  const parsed = parse(source, createLexer(source), { target });
  const analysis = analyze(parsed.program, source, { target, ...(options.session ? { session: options.session } : {}) });
  const raws = [...parsed.diagnostics, ...analysis.diagnostics].toSorted((a, b) => a.start - b.start);
  const diagnostics = raws.map((raw) => toDiagnostic(raw, source, tone));
  const errors = raws.filter((raw) => severityOf(raw.code) === 'error');
  if (errors.length > 0) {
    return { ok: false, diagnostics, incomplete: target === 'repl' && errors.every((raw) => INCOMPLETE_CODES.has(raw.code)) };
  }
  return buildSuccess(source, parsed, analysis, diagnostics, options, target);
}

// Sem o texto do erro técnico: a mensagem do motor seria inglês e o GS0901 já pede o relato.
function internalFailure(tone: Tone): CompileFailure {
  const raw: RawDiagnostic = { code: INTERNAL_ERROR_CODE, start: 0, end: 0, args: {} };
  return { ok: false, diagnostics: [toDiagnostic(raw, createSourceText('', DEFAULT_FILE_NAME), tone)], incomplete: false };
}

function buildSuccess(
  source: SourceText,
  parsed: ParseResult,
  analysis: AnalysisResult,
  diagnostics: readonly Diagnostic[],
  options: CompileOptions,
  target: CompileTarget,
): CompileSuccess {
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
  };
}

export function mergeSession(previous: ReplSession | undefined, analysis: AnalysisResult): ReplSession {
  const merged = [...(previous?.bindings ?? []), ...analysis.topLevelBindings];
  const bindings = new Map(merged.map((binding) => [binding.name, binding] as const));
  const members = new Set([...(previous?.members ?? []), ...analysis.declaredMembers]);
  return { bindings: [...bindings.values()], members: [...members].toSorted() };
}
