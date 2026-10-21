import { keyName } from '../ast-utils.mjs';
import {
  HISTORY_STRONG,
  HISTORY_TEMPORAL,
  HISTORY_WEAK,
  NARRATION_MAX_WORDS,
  RATIONALE_MARKER,
  detectLanguage,
  matchPatterns,
} from './comment-patterns.mjs';

const LONG_BLOCK_LIMIT = 4;
const PREVIEW_LENGTH = 110;

function preview(text) {
  const flat = text.replace(/^[\s*]+/gm, '').replace(/\s+/g, ' ').trim();
  return flat.length > PREVIEW_LENGTH ? `${flat.slice(0, PREVIEW_LENGTH - 1)}…` : flat;
}

function continuesGroup(previous, record) {
  const last = previous?.members[previous.members.length - 1];
  return Boolean(last && record.line === last.endLine + 1 && record.column === last.column);
}

function toLogical(members) {
  const first = members[0];
  const text = members.map((member) => member.text).join('\n');
  return {
    kind: members.length > 1 ? 'line-group' : first.kind,
    line: first.line,
    endLine: members[members.length - 1].endLine,
    start: first.start,
    text,
    contentLines: members.length > 1 ? members.length : first.contentLines,
    standalone: first.standalone,
    language: members.length > 1 ? detectLanguage(text) : first.language,
  };
}

// Linhas "//" consecutivas, alinhadas e sozinhas na linha formam UM comentário lógico;
// os demais (bloco, JSDoc, comentário ao lado do código) são comentários lógicos por si.
export function buildLogicalComments(records) {
  const logical = [];
  let group = null;
  for (const record of records) {
    if (record.directive) {
      group = null;
      continue;
    }
    const groupable = record.kind === 'line' && record.standalone;
    if (groupable && continuesGroup(group, record)) {
      group.members.push(record);
    } else if (groupable) {
      group = { members: [record] };
      logical.push(group);
    } else {
      group = null;
      logical.push({ members: [record] });
    }
  }
  return logical.map(({ members }) => toLogical(members));
}

function insideAnyFunction(comment, functions) {
  return functions.some((fn) => comment.line >= fn.line && comment.endLine <= fn.endLine);
}

function collectAttachedJsdoc(ctx) {
  const attached = new Map();
  ctx.traverse(ctx.ast, {
    enter(path) {
      const { node } = path;
      for (const comment of node.leadingComments ?? []) {
        if (comment.type === 'CommentBlock' && comment.value.startsWith('*')) {
          attached.set(comment.start, { name: keyName(node.key, node.computed) ?? node.id?.name ?? null });
        }
      }
    },
  });
  return attached;
}

function isPrivateJsdoc(comment, attached) {
  if (/@private\b/.test(comment.text)) return true;
  const target = attached.get(comment.start);
  return Boolean(target?.name && /^[_#]/.test(target.name));
}

// Blocos sem instruções cujo único conteúdo é comentário: o comentário explica a omissão (ex.: catch vazio).
function collectEmptyBlocks(ctx) {
  const ranges = [];
  ctx.traverse(ctx.ast, {
    BlockStatement(path) {
      const { node } = path;
      if (node.body.length === 0 && (node.directives ?? []).length === 0) ranges.push([node.start, node.end]);
    },
  });
  return ranges;
}

function isNarration(comment, emptyBlocks) {
  if (!comment.standalone || comment.kind === 'jsdoc') return false;
  const words = comment.text.replace(/^[\s*]+/gm, '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > NARRATION_MAX_WORDS) return false;
  if (RATIONALE_MARKER.test(comment.text)) return false;
  return !emptyBlocks.some(([from, to]) => comment.start > from && comment.start < to);
}

function describeMatches(matches) {
  return matches.map((match) => `${match.id}:${match.match}`);
}

export function analyzeComments(ctx, functions) {
  const records = ctx.commentRecords;
  const logical = buildLogicalComments(records);
  const attached = collectAttachedJsdoc(ctx);
  const history = [];
  const weakHistory = [];
  for (const comment of logical) {
    const hard = [...matchPatterns(HISTORY_STRONG, comment.text), ...matchPatterns(HISTORY_TEMPORAL, comment.text)];
    const weak = matchPatterns(HISTORY_WEAK, comment.text);
    const entry = { line: comment.line, endLine: comment.endLine, text: preview(comment.text) };
    if (hard.length > 0) history.push({ ...entry, matches: describeMatches(hard) });
    else if (weak.length > 0) weakHistory.push({ ...entry, matches: describeMatches(weak) });
  }
  const emptyBlocks = collectEmptyBlocks(ctx);
  const narrations = logical
    .filter((comment) => isNarration(comment, emptyBlocks))
    .map((comment) => ({ line: comment.line, text: preview(comment.text) }));
  const jsdocs = logical.filter((comment) => comment.kind === 'jsdoc');
  const languages = { pt: 0, en: 0, unk: 0 };
  for (const comment of logical) languages[comment.language] += 1;
  return {
    total: records.length,
    prose: logical.length,
    directives: records.filter((record) => record.directive).length,
    longBlocks: logical
      .filter((comment) => comment.contentLines > LONG_BLOCK_LIMIT)
      .map((comment) => ({ kind: comment.kind, line: comment.line, endLine: comment.endLine, contentLines: comment.contentLines, preview: preview(comment.text) })),
    trailing: logical
      .filter((comment) => !comment.standalone)
      .map((comment) => ({ line: comment.line, text: preview(comment.text) })),
    history,
    weakHistory,
    narrations,
    inBody: logical
      .filter((comment) => comment.standalone && comment.kind !== 'jsdoc' && insideAnyFunction(comment, functions))
      .map((comment) => ({ line: comment.line, text: preview(comment.text), language: comment.language })),
    jsdoc: jsdocs.length,
    jsdocPrivate: jsdocs
      .filter((comment) => isPrivateJsdoc(comment, attached))
      .map((comment) => ({ line: comment.line, text: preview(comment.text) })),
    languages,
  };
}
