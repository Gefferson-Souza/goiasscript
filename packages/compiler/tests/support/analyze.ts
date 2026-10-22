import { analyze } from '../../src/analyzer/analyzer.ts';
import { createLexer } from '../../src/lexer/lexer.ts';
import { parse } from '../../src/parser/parser.ts';
import { createSourceText } from '../../src/source/source-text.ts';
import type { AnalyzeOptions, AnalyzedSource } from './analyze.types.ts';

export function analyzeSource(text: string, options: AnalyzeOptions = {}): AnalyzedSource {
  const source = createSourceText(text, 'programa.gs');
  const target = options.target ?? 'module';
  const parsed = parse(source, createLexer(source), { target });
  const analysis = analyze(parsed.program, source, {
    target,
    ...(options.session ? { session: options.session } : {}),
  });
  const codes = [...analysis.diagnostics].sort((a, b) => a.start - b.start).map((item) => item.code);
  return { analysis, codes, parsed, source };
}
