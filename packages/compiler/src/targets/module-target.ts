import type { AnalysisResult } from '../analyzer/analyzer.types.ts';
import type { Program } from '../ast/ast.types.ts';
import { emitHelpers } from '../helpers/emit-helpers.ts';
import { DEFAULT_LOOP_LIMIT, TICK_HELPER } from '../helpers/helper.constants.ts';
import { helperSourceOf } from '../helpers/helper-sources.ts';
import { applyEdits } from '../lowering/apply-edits.ts';
import type { LowerOptions } from '../lowering/edit.types.ts';
import { lower } from '../lowering/lower.ts';
import type { SourceText } from '../source/source.types.ts';
import { tickSource } from './loop-guard.ts';
import type { EmitResult } from './target.types.ts';

function helperSource(name: string, options: LowerOptions): string {
  if (name === TICK_HELPER) return tickSource(options.loopLimit ?? DEFAULT_LOOP_LIMIT);
  const found = helperSourceOf(name, options.target);
  if (found === undefined) throw new Error(`ajudante sem fonte: ${name}`);
  return found;
}

export function emitProgram(program: Program, analysis: AnalysisResult, source: SourceText, options: LowerOptions): EmitResult {
  const lowered = lower(program, analysis, source, options);
  const applied = applyEdits(source, lowered.edits);
  const emitted = emitHelpers(applied.code, lowered.helpers.map((name) => helperSource(name, options)));
  return { code: emitted.code, segments: applied.segments, helperRange: emitted.helperRange, helpers: lowered.helpers, awaitable: lowered.awaitable };
}
