import { MESSAGE_TYPES } from '../../sandbox/protocol.constants.ts';
import { parseRunnerMessage } from './message-guards.ts';
import { armMaxTimer, conclude, createSession, handleMessage, resumeAfterAnswer } from './run-session.ts';
import type { RunEvent, RunSession, RunnerClient, RunnerClientOptions, SessionDeps } from './runner-client.types.ts';

const TERMINAL_KINDS: ReadonlySet<RunEvent['kind']> = new Set(['failed', 'timeout', 'finished', 'stopped']);

export function createRunnerClient(options: RunnerClientOptions): RunnerClient {
  const deps: SessionDeps = { limits: options.limits, now: options.now, timers: options.timers, tone: options.tone ?? 'raiz' };
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
      // O Worker é do host: a propriedade é atribuída aqui e solta no terminate.
      // eslint-disable-next-line functional/immutable-data -- atribuição do callback de mensagem exigida pela API do Worker
      worker.onmessage = (event) => {
        const message = parseRunnerMessage(event.data, deps.limits);
        if (message !== null) handleMessage(session, message, deps);
      };
      worker.postMessage({ type: MESSAGE_TYPES.execute, runId: session.runId, code: request.compiled.code });
      armMaxTimer(session, deps);
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
