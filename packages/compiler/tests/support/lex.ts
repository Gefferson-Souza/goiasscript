import { createLexer } from '../../src/lexer/lexer.ts';
import type { Lexer, Token } from '../../src/lexer/token.types.ts';
import { createSourceText } from '../../src/source/source-text.ts';

function* drain(lexer: Lexer): Generator<Token> {
  for (;;) {
    const token = lexer.next();
    yield token;
    if (token.kind === 'end-of-file') return;
  }
}

export function lexAll(text: string) {
  const lexer = createLexer(createSourceText(text, 't.gs'));
  const tokens = [...drain(lexer)];
  return { tokens, diagnostics: lexer.diagnostics };
}

export const kindsOf = (text: string) => lexAll(text).tokens.map((token) => token.kind);
export const codesOf = (text: string) => lexAll(text).diagnostics.map((diagnostic) => diagnostic.code);
export const valuesOf = (text: string) => lexAll(text).tokens.filter((token) => token.kind !== 'end-of-file').map((token) => token.value);
