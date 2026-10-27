import type { RuntimeErrorContext } from '@goiasscript/compiler';
import { MESSAGE_TYPES } from '../../sandbox/protocol.constants.ts';
import type { RunnerToHost } from '../../sandbox/protocol.types.ts';
import { hostDiagnostic } from './host-diagnostics.ts';
import { createOutputBuffer, visibleText } from './output-buffer.ts';
import { createCell, isActive, nextPhase } from './run-state.ts';
import type { RunEvent, RunRequest, RunSession, RunSignal, SessionDeps, TimerHandle, WorkerPort } from './runner-client.types.ts';

const GENERIC_ERROR_NAME = 'Error';

type FailedMessage = Extract<RunnerToHost, { readonly type: typeof MESSAGE_TYPES.failed }>;

export function createSession(runId: number, worker: WorkerPort, request: RunRequest, emit: (event: RunEvent) => void, deps: SessionDeps): RunSession {
  return {
    runId,
    worker,
    request,
    emit,
    buffer: createOutputBuffer(deps.limits),
    phase: createCell('running' as const),
    ready: createCell(false),
    idleTimer: createCell<TimerHandle | null>(null),
    maxTimer: createCell<TimerHandle | null>(null),
    wallTimer: createCell<TimerHandle | null>(null),
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
  clearTimer(deps.timers, session.wallTimer);
  session.worker.terminate();
  if (event !== null) session.emit(event);
}

// Teto de parede: o relógio de maxTimer pausa em pergunta, e o Worker pode forjar pergunta sem runId.
export function armWallTimer(session: RunSession, deps: SessionDeps): void {
  session.wallTimer.set(deps.timers.setTimeout(() => {
    conclude(session, 'timeout', { kind: 'timeout' }, deps);
  }, deps.limits.maxRunMs + deps.limits.maxAskWaitMs));
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
  if (session.phase.get() !== 'running') return;
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

function runtimeContextOf(session: RunSession): RuntimeErrorContext {
  const { compiled, fileName, source } = session.request;
  return { map: compiled.map, helperRange: compiled.helperRange, fileName, source };
}

function handleFailed(session: RunSession, message: FailedMessage, deps: SessionDeps): void {
  const error = {
    name: message.errorName,
    stack: message.stack,
    ...(message.gsCode === undefined ? {} : { gsCode: message.gsCode }),
    ...(message.gsLine === undefined ? {} : { gsLine: message.gsLine }),
  };
  concludeTranslated(session, error, deps);
}

// O tradutor vem de um chunk carregado sob demanda; se o carregamento falhar, o aluno ainda recebe um diagnóstico.
function concludeTranslated(session: RunSession, error: unknown, deps: SessionDeps): void {
  deps.loadTranslator().then(
    (translate) => {
      conclude(session, 'fail', { kind: 'failed', diagnostic: translate(error, runtimeContextOf(session), deps.tone) }, deps);
    },
    () => {
      conclude(session, 'fail', { kind: 'failed', diagnostic: hostDiagnostic('loadFailure', deps.tone) }, deps);
    },
  );
}

export function handleWorkerError(session: RunSession, event: ErrorEvent, deps: SessionDeps): void {
  if (session.ready.get()) {
    concludeTranslated(session, { name: GENERIC_ERROR_NAME, stack: event.message }, deps);
    return;
  }
  conclude(session, 'fail', { kind: 'failed', diagnostic: hostDiagnostic('loadFailure', deps.tone) }, deps);
}

export function handleWorkerMessageError(session: RunSession, deps: SessionDeps): void {
  conclude(session, 'fail', { kind: 'failed', diagnostic: hostDiagnostic('unreadableMessage', deps.tone) }, deps);
}

export function handleMessage(session: RunSession, message: RunnerToHost, deps: SessionDeps): void {
  if (!isActive(session.phase.get())) return;
  switch (message.type) {
    case MESSAGE_TYPES.ask:
      handleAsk(session, message.prompt, deps);
      return;
    case MESSAGE_TYPES.ready:
      session.ready.set(true);
      armIdleTimer(session, deps);
      return;
    default:
      if (message.runId !== session.runId) return;
  }
  if (message.type === MESSAGE_TYPES.log) handleLog(session, message, deps);
  else if (message.type === MESSAGE_TYPES.finished) armIdleTimer(session, deps);
  else handleFailed(session, message, deps);
}

export function resumeAfterAnswer(session: RunSession, value: string, deps: SessionDeps): void {
  if (session.phase.get() !== 'asking') return;
  session.phase.set(nextPhase('asking', 'answer'));
  session.worker.postMessage({ type: MESSAGE_TYPES.answer, value });
  armMaxTimer(session, deps);
  armIdleTimer(session, deps);
}
