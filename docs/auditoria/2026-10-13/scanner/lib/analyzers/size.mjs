function buildCommentMask(ctx) {
  const mask = new Uint8Array(ctx.text.length);
  for (const comment of ctx.comments) mask.fill(1, comment.start, comment.end);
  return mask;
}

function classifyLine(ctx, mask, index) {
  const from = ctx.lineStarts[index];
  const to = from + ctx.lines[index].length;
  let hasCode = false;
  let hasComment = false;
  for (let offset = from; offset < to; offset += 1) {
    if (/\s/.test(ctx.text[offset])) continue;
    if (mask[offset]) hasComment = true;
    else hasCode = true;
  }
  if (hasCode) return 'code';
  return hasComment ? 'comment' : 'blank';
}

// lineKinds é indexado a partir de 1 para coincidir com a numeração do Babel.
export function analyzeSize(ctx) {
  const mask = buildCommentMask(ctx);
  const lineKinds = [null];
  const counts = { code: 0, comment: 0, blank: 0 };
  for (let index = 0; index < ctx.lines.length; index += 1) {
    const kind = classifyLine(ctx, mask, index);
    lineKinds.push(kind);
    counts[kind] += 1;
  }
  ctx.lineKinds = lineKinds;
  return {
    lines: ctx.lines.length,
    codeLines: counts.code,
    commentLines: counts.comment,
    blankLines: counts.blank,
    over400: ctx.lines.length > 400,
    over800: ctx.lines.length > 800,
  };
}

export function countKindsInRange(ctx, fromLine, toLine, kind) {
  let total = 0;
  for (let line = fromLine; line <= toLine; line += 1) {
    if (ctx.lineKinds[line] === kind) total += 1;
  }
  return total;
}
