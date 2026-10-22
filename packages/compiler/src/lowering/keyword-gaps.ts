import { createLexer } from '../lexer/lexer.ts';
import type { Token } from '../lexer/token.types.ts';
import { createSourceText } from '../source/source-text.ts';
import type { SourceText } from '../source/source.types.ts';

// A AST não guarda algumas keywords (`é` do declarador, `se_não`, `por_fim`, `inherda_de`, `de`/`em`): relê o trecho entre os nós.
export function keywordInGap(source: SourceText, from: number, to: number): Token | undefined {
  const slice = createSourceText(source.text.slice(from, to), source.fileName);
  const lexer = createLexer(slice);
  for (let token = lexer.next(); token.kind !== 'end-of-file'; token = lexer.next()) {
    if (token.kind === 'keyword') return { ...token, start: token.start + from, end: token.end + from };
  }
  return undefined;
}
