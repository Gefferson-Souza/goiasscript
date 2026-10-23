import type { CompileSuccess, Diagnostic } from '@goiasscript/compiler';
import type { CompileView } from '../compile-service.types.ts';
import type { RunEvent } from '../run/runner-client.types.ts';
import { CRLF, GRADE_FILE_NAME, GRADE_REASONS, OUTPUT_LINE_JOINER, TRAILING_BLANKS, TRAILING_NEWLINES } from './grade-exercise.constants.ts';
import type { CollectorState, CollectorStep } from './grade-exercise.internal.types.ts';
import type { GradeDeps, GradeRequest, GradeResult } from './grade-exercise.types.ts';

// Fim de linha, espaço no fim da linha e linhas vazias finais não contam na comparação.
export function normalizeStdout(text: string): string {
  return text
    .replace(CRLF, OUTPUT_LINE_JOINER)
    .split(OUTPUT_LINE_JOINER)
    .map((line) => line.replace(TRAILING_BLANKS, ''))
    .join(OUTPUT_LINE_JOINER)
    .replace(TRAILING_NEWLINES, '');
}

const joinLines = (lines: readonly string[]): string => normalizeStdout(lines.join(OUTPUT_LINE_JOINER));

function stepOnAsk(state: CollectorState): CollectorStep {
  const [next, ...rest] = state.answers;
  if (next === undefined) return { state, effect: { kind: 'finish', verdict: 'run-failed', reason: GRADE_REASONS.tooManyQuestions, stopRunner: true } };
  return { state: { ...state, answers: rest }, effect: { kind: 'answer', value: next } };
}

function stepOnFinished(state: CollectorState, expected: string): CollectorStep {
  const correct = !state.truncated && joinLines(state.lines) === expected;
  return { state, effect: { kind: 'finish', verdict: correct ? 'correct' : 'wrong' } };
}

// Passo puro: a máquina de coleta recebe o evento e devolve o novo estado e o que fazer.
export function stepCollector(state: CollectorState, event: RunEvent, expected: string): CollectorStep {
  const idle: CollectorStep = { state, effect: { kind: 'none' } };
  switch (event.kind) {
    case 'out':
      return { state: { ...state, lines: [...state.lines, event.text] }, effect: idle.effect };
    case 'truncated':
      return { state: { ...state, truncated: true }, effect: idle.effect };
    case 'ask':
      return stepOnAsk(state);
    case 'finished':
      return stepOnFinished(state, expected);
    case 'failed':
      return { state, effect: { kind: 'finish', verdict: 'run-failed', reason: event.diagnostic.message } };
    case 'timeout':
      return { state, effect: { kind: 'finish', verdict: 'timeout' } };
    case 'stopped':
      return { state, effect: { kind: 'finish', verdict: 'run-failed', reason: GRADE_REASONS.stopped } };
    case 'err':
      return idle;
  }
}

function drive(compiled: CompileSuccess, request: GradeRequest, deps: GradeDeps): Promise<GradeResult> {
  const expectedStdout = normalizeStdout(request.exercise.expectedStdout);
  return new Promise<GradeResult>((resolve) => {
    let state: CollectorState = { lines: [], answers: request.exercise.stdin ?? [], truncated: false };
    const onEvent = (event: RunEvent): void => {
      const step = stepCollector(state, event, expectedStdout);
      state = step.state;
      const { effect } = step;
      if (effect.kind === 'answer') deps.runner.answer(effect.value);
      if (effect.kind !== 'finish') return;
      if (effect.stopRunner === true) deps.runner.stop();
      resolve({ verdict: effect.verdict, actualStdout: joinLines(state.lines), expectedStdout, ...(effect.reason === undefined ? {} : { reason: effect.reason }) });
    };
    deps.runner.run({ compiled, source: request.source, fileName: GRADE_FILE_NAME }, onEvent);
  });
}

const firstError = (view: CompileView): Diagnostic | undefined =>
  view.result.ok ? undefined : view.result.diagnostics.find((diagnostic) => diagnostic.severity === 'error');

async function compileSafely(deps: GradeDeps, source: string): Promise<CompileView | null> {
  try {
    return await deps.compile(source);
  } catch {
    return null;
  }
}

export async function gradeExercise(request: GradeRequest, deps: GradeDeps): Promise<GradeResult> {
  const expectedStdout = normalizeStdout(request.exercise.expectedStdout);
  const view = await compileSafely(deps, request.source);
  if (view === null) return { verdict: 'compile-failed', actualStdout: '', expectedStdout, reason: GRADE_REASONS.compileCrashed };
  if (!view.result.ok) {
    const diagnostic = firstError(view);
    return { verdict: 'compile-failed', actualStdout: '', expectedStdout, ...(diagnostic === undefined ? {} : { diagnostic }) };
  }
  return drive(view.result, request, deps);
}
