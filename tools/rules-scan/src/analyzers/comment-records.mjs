import { detectLanguage } from './comment-patterns.mjs';

const DIRECTIVE_PATTERN =
  /^\s*(?:eslint(?:-disable|-enable|-env)?\b|globals?\s|istanbul\s|c8\s|v8\s|prettier-ignore|@ts-(?:ignore|expect-error|nocheck|check)|jshint|webpack[A-Z]|#__PURE__|@__PURE__|@vite-ignore|@license|@preserve|@jsx|@refresh|\/\s*<(?:reference|amd))/;

function commentKind(comment) {
  if (comment.type === 'CommentLine') return 'line';
  return comment.value.startsWith('*') ? 'jsdoc' : 'block';
}

// Linhas de conteúdo: descarta a linha do delimitador de abertura/fechamento quando só ele está nela.
function countContentLines(comment) {
  if (comment.type === 'CommentLine') return 1;
  const parts = comment.value.split('\n');
  const first = parts[0].replace(/^\*+/, '').trim();
  let total = parts.length;
  if (first === '') total -= 1;
  if (parts.length > 1 && parts[parts.length - 1].trim() === '') total -= 1;
  return Math.max(total, 1);
}

function isStandalone(before, after, comment) {
  const codeBefore = /\S/.test(before);
  const codeAfter = /\S/.test(after);
  const isJsxContainer = /^\s*\{\s*$/.test(before) && /^\s*\}/.test(after);
  if (isJsxContainer) return true;
  if (codeBefore) return false;
  return comment.type === 'CommentLine' || !codeAfter;
}

export function buildCommentRecords(ctx) {
  return ctx.comments.map((comment) => {
    const first = comment.loc.start;
    const last = comment.loc.end;
    const before = ctx.lines[first.line - 1].slice(0, first.column);
    const after = ctx.lines[last.line - 1].slice(last.column);
    return {
      kind: commentKind(comment),
      line: first.line,
      endLine: last.line,
      column: first.column,
      start: comment.start,
      end: comment.end,
      text: comment.value,
      rawLines: last.line - first.line + 1,
      contentLines: countContentLines(comment),
      standalone: isStandalone(before, after, comment),
      directive: DIRECTIVE_PATTERN.test(comment.value),
      language: detectLanguage(comment.value),
      codeBefore: before.trim().slice(-60),
    };
  });
}
