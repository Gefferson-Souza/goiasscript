import type { Token } from '../lexer/token.types.ts';

export const isPunctuator = (token: Token, value: string): boolean => token.kind === 'punctuator' && token.value === value;

export const isKeyword = (token: Token, js: string): boolean => token.kind === 'keyword' && token.keyword?.js === js;

export const keywordJs = (token: Token): string | undefined => (token.kind === 'keyword' ? token.keyword?.js : undefined);

export const isWord = (token: Token): boolean => token.kind === 'identifier' || token.kind === 'keyword';

export const isStatementEnd = (token: Token): boolean =>
  token.kind === 'newline' || token.kind === 'end-of-file' || isPunctuator(token, ';') || isPunctuator(token, '}');
