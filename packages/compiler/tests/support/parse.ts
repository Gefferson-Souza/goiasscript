import type { CompileTarget } from '../../src/api.types.ts';
import type { ParseResult } from '../../src/ast/ast.types.ts';
import { createLexer } from '../../src/lexer/lexer.ts';
import { parse } from '../../src/parser/parser.ts';
import { createSourceText } from '../../src/source/source-text.ts';

export function parseText(text: string, target: CompileTarget = 'module'): ParseResult {
  const source = createSourceText(text, 't.gs');
  return parse(source, createLexer(source), { target });
}

export const codes = (result: ParseResult): readonly string[] => result.diagnostics.map((diagnostic) => diagnostic.code);
