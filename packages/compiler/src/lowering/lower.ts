import type { Program } from '../ast/ast.types.ts';
import type { AnalysisResult } from '../analyzer/analyzer.types.ts';
import { TICK_HELPER } from '../helpers/helper.constants.ts';
import { loopGuardEdits, strictDirectiveEdit } from '../targets/playground-target.ts';
import { needsAsyncWrapper, replClosingEdits, replOpeningEdits } from '../targets/repl-target.ts';
import type { SourceText } from '../source/source.types.ts';
import { askAwaitEdits } from './await-edits.ts';
import type { Edit, EditContext, LowerOptions, LoweringResult } from './edit.types.ts';
import { helperCallEdits } from './helper-call-edits.ts';
import { keywordEdits } from './keyword-edits.ts';
import { helperNamesOf, libraryEdits } from './library-edits.ts';
import { macroEdits } from './macro-edits.ts';
import { nfcEdits } from './nfc-edits.ts';
import { terminatorEdits } from './terminator-edits.ts';
import { createOrderCounter, flatMapTree } from './traversal.ts';

const BYTE_ORDER_MARK = '﻿';

const byteOrderMarkEdits = (context: EditContext): readonly Edit[] =>
  context.source.text.startsWith(BYTE_ORDER_MARK) ? [{ start: 0, end: 1, text: '', order: context.nextOrder() }] : [];

// Terminadores numa segunda passada: no mesmo offset o `;` entra depois de qualquer `)` inserido.
export function collectEdits(program: Program, context: EditContext): readonly Edit[] {
  const structural = flatMapTree(program, (node, parent) => [
    ...keywordEdits(node, parent, context),
    ...nfcEdits(node, parent, context),
    ...libraryEdits(node, parent, context),
    ...macroEdits(node, parent, context),
    ...helperCallEdits(node, context),
    ...askAwaitEdits(node, parent, context),
  ]);
  const terminators = flatMapTree(program, (node) => terminatorEdits(node, context));
  return [...byteOrderMarkEdits(context), ...structural, ...terminators];
}

export const collectHelpers = (program: Program, context: EditContext): readonly string[] =>
  [...new Set(flatMapTree(program, (node) => helperNamesOf(node, context)))];

const openingEdits = (program: Program, context: EditContext): readonly Edit[] => {
  if (context.target === 'repl') return replOpeningEdits(program, context);
  return context.target === 'playground' ? [strictDirectiveEdit(context)] : [];
};

export function lower(program: Program, analysis: AnalysisResult, source: SourceText, options: LowerOptions): LoweringResult {
  const context: EditContext = {
    source,
    analysis,
    target: options.target,
    nextOrder: createOrderCounter(),
    ...(options.session === undefined ? {} : { session: options.session }),
  };
  const opening = openingEdits(program, context);
  const guard = options.target === 'playground' ? loopGuardEdits(program, context) : [];
  const body = collectEdits(program, context);
  const closing = options.target === 'repl' ? replClosingEdits(program, context) : [];
  return {
    edits: [...opening, ...guard, ...body, ...closing],
    helpers: [...collectHelpers(program, context), ...(guard.length > 0 ? [TICK_HELPER] : [])],
    awaitable: options.target === 'repl' && needsAsyncWrapper(program, context),
  };
}
