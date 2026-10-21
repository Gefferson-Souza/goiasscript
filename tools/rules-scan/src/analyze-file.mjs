import fs from 'node:fs';
import { analyzeCatchBlocks } from './analyzers/catch-blocks.mjs';
import { buildCommentRecords } from './analyzers/comment-records.mjs';
import { analyzeComments } from './analyzers/comments.mjs';
import { analyzeProgramDepth } from './analyzers/depth.mjs';
import { analyzeFunctions } from './analyzers/functions.mjs';
import { analyzeIdentifiers } from './analyzers/identifiers.mjs';
import { analyzeMagicNumbers, analyzeMagicStrings } from './analyzers/magic-values.mjs';
import { analyzeMutation } from './analyzers/mutation.mjs';
import { analyzeSize } from './analyzers/size.mjs';
import { analyzeSuppressions } from './analyzers/suppressions.mjs';
import { analyzeConsole, analyzeTypeEscapes } from './analyzers/type-escapes.mjs';
import { extractEmbeddedSources, toEmbeddedContext } from './embedded.mjs';
import { buildLineIndex, parseSource, splitLines } from './parse.mjs';

export function buildContext(file, deps, sourceText) {
  const text = sourceText ?? fs.readFileSync(file.abs, 'utf8');
  const { ast, comments, parseErrors } = parseSource(deps.parser, text, file);
  return {
    file,
    isTest: file.role === 'test',
    isTs: ['.ts', '.tsx'].includes(file.ext),
    text,
    lines: splitLines(text),
    lineStarts: buildLineIndex(text),
    ast,
    comments,
    parseErrors,
    parser: deps.parser,
    traverse: deps.traverse,
    t: deps.types,
    embedded: false,
    lineOffset: 0,
  };
}

function analyzeAllIdentifiers(ctx, lexicon, surface) {
  const own = analyzeIdentifiers(ctx, lexicon, surface);
  const embeddedSources = extractEmbeddedSources(ctx);
  const embeddedResults = embeddedSources.map((source) => ({
    source,
    result: analyzeIdentifiers(toEmbeddedContext(ctx, source), lexicon, surface),
  }));
  return {
    declaredTotal: own.declaredTotal + embeddedResults.reduce((sum, r) => sum + r.result.declaredTotal, 0),
    declaredEmbedded: embeddedResults.reduce((sum, r) => sum + r.result.declaredTotal, 0),
    embeddedBlocks: embeddedSources.map((s) => ({ line: s.startLine, lines: s.span })),
    items: [...own.items, ...embeddedResults.flatMap((r) => r.result.items)],
  };
}

function maxDepthOf(functions, programDepth) {
  const deepest = functions.reduce((best, fn) => (fn.maxDepth > best.max ? { max: fn.maxDepth, line: fn.maxDepthLine } : best), programDepth);
  return { max: deepest.max, line: deepest.line };
}

export function analyzeFile(ctx, lexicon, surface) {
  const size = analyzeSize(ctx);
  ctx.commentRecords = buildCommentRecords(ctx);
  const functions = analyzeFunctions(ctx);
  const programDepth = analyzeProgramDepth(ctx);
  return {
    file: ctx.file.rel,
    pkg: ctx.file.pkg,
    role: ctx.file.role,
    isTest: ctx.isTest,
    isTs: ctx.isTs,
    parseErrors: ctx.parseErrors.length,
    size,
    functions,
    depth: maxDepthOf(functions, programDepth),
    suppressions: analyzeSuppressions(ctx),
    comments: analyzeComments(ctx, functions),
    typeEscapes: analyzeTypeEscapes(ctx),
    consoleCalls: analyzeConsole(ctx),
    identifiers: analyzeAllIdentifiers(ctx, lexicon, surface),
    magicNumbers: analyzeMagicNumbers(ctx),
    magicStrings: analyzeMagicStrings(ctx),
    mutation: analyzeMutation(ctx),
    catches: analyzeCatchBlocks(ctx),
  };
}
