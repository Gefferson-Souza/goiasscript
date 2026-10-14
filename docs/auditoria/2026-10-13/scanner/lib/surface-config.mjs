// Arquivos que definem a superfície da linguagem (keywords, métodos, comandos de CLI/REPL).
const SURFACE_FILE_PATTERNS = [
  /^packages\/core\/src\//,
  /^packages\/core\/bin\//,
  /^vscode-extension\/src\//,
  /^apps\/playground\/lib\/monaco-goias\.ts$/,
];

// Só nestes arquivos uma chave de tabela "nome -> texto" é nome da linguagem: a tabela de
// keywords do lexer e as tabelas de documentação/exemplo indexadas por método goiano.
// Em qualquer outro arquivo (erros, ícones, tema) a chave é identificador interno.
export const OBJECT_KEY_SURFACE_FILES = new Set([
  'packages/core/src/compiler/lexer.js',
  'packages/core/src/compiler/simpleTranspiler.js',
  'packages/core/src/goianoMethods/GoianoBuiltins.js',
]);

export function isSurfaceFile(rel) {
  return SURFACE_FILE_PATTERNS.some((pattern) => pattern.test(rel));
}
