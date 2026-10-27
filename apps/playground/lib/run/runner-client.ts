import { MESSAGE_TYPES } from '../../sandbox/protocol.constants.ts';
import { parseRunnerMessage } from './message-guards.ts';
import { armMaxTimer, armWallTimer, conclude, createSession, handleMessage, handleWorkerError, handleWorkerMessageError, resumeAfterAnswer } from './run-session.ts';
import type { RunEvent, RunSession, RunnerClient, RunnerClientOptions, RuntimeErrorTranslator, SessionDeps, WorkerPort } from './runner-client.types.ts';

const defaultLoadTranslator = (): Promise<RuntimeErrorTranslator> => import('@goiasscript/compiler').then((module) => module.translateRuntimeError);

const TERMINAL_KINDS: ReadonlySet<RunEvent['kind']> = new Set(['failed', 'timeout', 'finished', 'stopped']);

function bindWorker(worker: WorkerPort, session: RunSession, deps: SessionDeps): void {
  // O Worker é do host: os callbacks são atribuídos aqui e soltos no terminate.
  // eslint-disable-next-line functional/immutable-data -- callbacks de mensagem e erro exigidos pela API do Worker
  Object.assign(worker, {
    onmessage: (event: MessageEvent<unknown>): void => {
      const message = parseRunnerMessage(event.data, deps.limits);
      if (message !== null) handleMessage(session, message, deps);
    },
    onerror: (event: ErrorEvent): void => {
      event.preventDefault();
      handleWorkerError(session, event, deps);
    },
    onmessageerror: (): void => {
      handleWorkerMessageError(session, deps);
    },
  });
}

export function createRunnerClient(options: RunnerClientOptions): RunnerClient {
  const deps: SessionDeps = { limits: options.limits, now: options.now, timers: options.timers, tone: options.tone ?? 'raiz', loadTranslator: options.loadTranslator ?? defaultLoadTranslator };
  let current: RunSession | null = null;
  let lastRunId = 0;
  let disposed = false;

  const endCurrent = (): void => {
    if (current !== null) conclude(current, 'stop', null, deps);
    current = null;
  };

  return {
    run(request, onEvent) {
      endCurrent();
      if (disposed) return;
      lastRunId += 1;
      const worker = options.createWorker();
      const emit = (event: RunEvent): void => {
        if (TERMINAL_KINDS.has(event.kind) && current === session) current = null;
        onEvent(event);
      };
      const session = createSession(lastRunId, worker, request, emit, deps);
      current = session;
      bindWorker(worker, session, deps);
      worker.postMessage({ type: MESSAGE_TYPES.execute, runId: session.runId, code: request.compiled.code });
      armMaxTimer(session, deps);
      armWallTimer(session, deps);
    },
    answer(value) {
      if (current !== null) resumeAfterAnswer(current, value, deps);
    },
    stop() {
      if (current === null) return;
      conclude(current, 'stop', { kind: 'stopped' }, deps);
      current = null;
    },
    dispose() {
      disposed = true;
      endCurrent();
    },
  };
}
