const ESM_EXTENSIONS = new Set(['.mjs', '.ts', '.tsx']);

function pluginsFor(file) {
  if (file.rel.endsWith('.d.ts')) return [['typescript', { dts: true }]];
  if (file.ext === '.tsx') return ['typescript', 'jsx'];
  if (file.ext === '.ts') return ['typescript'];
  return [];
}

export function parseSource(parser, text, file) {
  const ast = parser.parse(text, {
    sourceType: ESM_EXTENSIONS.has(file.ext) ? 'module' : 'unambiguous',
    plugins: pluginsFor(file),
    errorRecovery: true,
    allowReturnOutsideFunction: true,
    allowAwaitOutsideFunction: true,
    allowImportExportEverywhere: true,
  });
  return { ast, comments: ast.comments ?? [], parseErrors: ast.errors ?? [] };
}

export function splitLines(text) {
  const lines = text.split(/\r?\n/);
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

export function buildLineIndex(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) starts.push(index + 1);
  }
  return starts;
}
