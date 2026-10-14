import { buildLineIndex, splitLines } from './parse.mjs';

const MIN_EMBEDDED_LINES = 20;

// Literais de template grandes sem interpolação que são JavaScript válido: código embutido
// (ex.: o runtime goiano que o transpilador injeta no início de todo programa).
export function extractEmbeddedSources(ctx) {
  const found = [];
  ctx.traverse(ctx.ast, {
    TemplateLiteral(path) {
      const { node } = path;
      const span = node.loc.end.line - node.loc.start.line + 1;
      if (node.expressions.length !== 0 || span < MIN_EMBEDDED_LINES) return;
      const cooked = node.quasis[0].value.cooked;
      if (typeof cooked !== 'string') return;
      const parsed = tryParse(ctx.parser, cooked);
      if (!parsed) return;
      found.push({
        ...parsed,
        text: cooked,
        lines: splitLines(cooked),
        lineStarts: buildLineIndex(cooked),
        startLine: node.loc.start.line,
        span,
      });
      path.skip();
    },
  });
  return found;
}

function tryParse(parser, source) {
  try {
    const ast = parser.parse(source, {
      sourceType: 'script',
      errorRecovery: true,
      allowReturnOutsideFunction: true,
    });
    if ((ast.errors ?? []).length > 0) return null;
    return { ast, comments: ast.comments ?? [] };
  } catch {
    return null;
  }
}

export function toEmbeddedContext(parentCtx, embedded) {
  return {
    ...parentCtx,
    ast: embedded.ast,
    comments: embedded.comments,
    text: embedded.text,
    lines: embedded.lines,
    lineStarts: embedded.lineStarts,
    isTs: false,
    embedded: true,
    lineOffset: embedded.startLine - 1,
  };
}
