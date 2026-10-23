import { translateRuntimeError } from '@goiasscript/compiler';
import { MESSAGE_TYPES } from '../../sandbox/protocol.constants.ts';
import type { RunnerToHost } from '../../sandbox/protocol.types.ts';
import { createOutputBuffer, visibleText } from './output-buffer.ts';
import { createCell, isActive, nextPhase } from './run-state.ts';
import type { RunEvent, RunRequest, RunSession, RunSignal, SessionDeps, TimerHandle, WorkerPort } from './runner-client.types.ts';

type FailedMessage = Extract<RunnerToHost, { readonly type: typeof MESSAGE_TYPES.failed }>;

export function createSession(runId: number, worker: WorkerPort, request: RunRequest, emit: (event: RunEvent) => void, deps: SessionDeps): RunSession {
  return {
    runId,
    worker,
    request,
    emit,
    buffer: createOutputBuffer(deps.limits),
    phase: createCell('running' as const),
    moduleDone: createCell(false),
    idleTimer: createCell<TimerHandle | null>(null),
    maxTimer: createCell<TimerHandle | null>(null),
    budgetMs: createCell(deps.limits.maxRunMs),
    segmentStartedAt: createCell(deps.now()),
  };
}

function clearTimer(timers: SessionDeps['timers'], cell: RunSession['idleTimer']): void {
  const handle = cell.get();
  if (handle !== null) timers.clearTimeout(handle);
  cell.set(null);
}

// Encerra no máximo uma vez: depois do primeiro sinal terminal a sessão fica inerte.
export function conclude(session: RunSession, signal: RunSignal, event: RunEvent | null, deps: SessionDeps): void {
  const phase = session.phase.get();
  if (!isActive(phase)) return;
  session.phase.set(nextPhase(phase, signal));
  clearTimer(deps.timers, session.idleTimer);
  clearTimer(deps.timers, session.maxTimer);
  session.worker.terminate();
  if (event !== null) session.emit(event);
}

export function armMaxTimer(session: RunSession, deps: SessionDeps): void {
  session.segmentStartedAt.set(deps.now());
  session.maxTimer.set(deps.timers.setTimeout(() => {
    conclude(session, 'timeout', { kind: 'timeout' }, deps);
  }, session.budgetMs.get()));
}

export function pauseMaxTimer(session: RunSession, deps: SessionDeps): void {
  clearTimer(deps.timers, session.maxTimer);
  session.budgetMs.set(Math.max(0, session.budgetMs.get() - (deps.now() - session.segmentStartedAt.get())));
}

export function armIdleTimer(session: RunSession, deps: SessionDeps): void {
  clearTimer(deps.timers, session.idleTimer);
  if (!session.moduleDone.get()) return;
  session.idleTimer.set(deps.timers.setTimeout(() => {
    conclude(session, 'finish', { kind: 'finished' }, deps);
  }, deps.limits.idleMs));
}

function handleLog(session: RunSession, message: Extract<RunnerToHost, { readonly type: typeof MESSAGE_TYPES.log }>, deps: SessionDeps): void {
  const accepted = session.buffer.accept(message.text);
  if (accepted.truncated !== null) {
    session.emit({ kind: 'truncated', reason: accepted.truncated });
    conclude(session, 'finish', { kind: 'finished' }, deps);
    return;
  }
  if (accepted.text !== null) session.emit({ kind: message.stream, text: visibleText(accepted.text) });
  armIdleTimer(session, deps);
}

function handleAsk(session: RunSession, prompt: string, deps: SessionDeps): void {
  if (session.phase.get() !== 'running') return;
  session.phase.set(nextPhase('running', 'ask'));
  clearTimer(deps.timers, session.idleTimer);
  pauseMaxTimer(session, deps);
  session.emit({ kind: 'ask', prompt: visibleText(prompt) });
}

function handleFailed(session: RunSession, message: FailedMessage, deps: SessionDeps): void {
  const error = {
    name: message.errorName,
    stack: message.stack,
    ...(message.gsCode === undefined ? {} : { gsCode: message.gsCode }),
    ...(message.gsLine === undefined ? {} : { gsLine: message.gsLine }),
  };
  const { compiled, fileName, source } = session.request;
  const context = { map: compiled.map, helperRange: compiled.helperRange, fileName, source };
  conclude(session, 'fail', { kind: 'failed', diagnostic: translateRuntimeError(error, context, deps.tone) }, deps);
}

function handleFinished(session: RunSession, deps: SessionDeps): void {
  session.moduleDone.set(true);
  if (session.phase.get() === 'running') armIdleTimer(session, deps);
}

export function handleMessage(session: RunSession, message: RunnerToHost, deps: SessionDeps): void {
  if (!isActive(session.phase.get())) return;
  switch (message.type) {
    case MESSAGE_TYPES.ask:
      handleAsk(session, message.prompt, deps);
      return;
    case MESSAGE_TYPES.ready:
      return;
    default:
      if (message.runId !== session.runId) return;
  }
  if (message.type === MESSAGE_TYPES.log) handleLog(session, message, deps);
  else if (message.type === MESSAGE_TYPES.finished) handleFinished(session, deps);
  else handleFailed(session, message, deps);
}

export function resumeAfterAnswer(session: RunSession, value: string, deps: SessionDeps): void {
  if (session.phase.get() !== 'asking') return;
  session.phase.set(nextPhase('asking', 'answer'));
  session.worker.postMessage({ type: MESSAGE_TYPES.answer, value });
  armMaxTimer(session, deps);
  armIdleTimer(session, deps);
}
