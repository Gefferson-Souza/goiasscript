import { compile } from '@goiasscript/compiler';
import type { ReplSession } from '@goiasscript/compiler';
import { runEntry } from './entry-runner.ts';
import { createHostContext } from './host-context.ts';
import { CANCELLED, EMPTY_SESSION, REPL_FILE_NAME } from './repl.constants.ts';
import type { ReplEngine, ReplEngineOptions } from './repl.types.ts';

export function createReplEngine(options: ReplEngineOptions): ReplEngine {
  let host = createHostContext(options.io);
  let session: ReplSession = EMPTY_SESSION;
  let cancelEntry: (() => void) | null = null;

  return {
    async evaluate(source) {
      const compiled = compile(source, { target: 'repl', fileName: REPL_FILE_NAME, tone: options.tone, session, sourceMap: true });
      if (!compiled.ok) return compiled.incomplete ? { kind: 'incomplete' } : { kind: 'failed', diagnostics: compiled.diagnostics, source };
      session = compiled.session ?? session;
      const cancellation = new Promise<typeof CANCELLED>((resolve) => {
        cancelEntry = () => {
          resolve(CANCELLED);
        };
      });
      const request = { source, compiled, context: host.context, tone: options.tone, cancellation };
      try {
        return await runEntry(options.entryTimeoutMs === undefined ? request : { ...request, timeoutMs: options.entryTimeoutMs });
      } finally {
        cancelEntry = null;
      }
    },
    hasPendingQuestion: () => host.questions.hasPending(),
    answer: (line) => {
      host.questions.answer(line);
    },
    cancelPendingQuestion() {
      host.questions.discard();
      cancelEntry?.();
    },
    endOfInput: () => {
      host.questions.end();
    },
    reset() {
      host.dispose();
      host = createHostContext(options.io);
      session = EMPTY_SESSION;
    },
    get session() {
      return session;
    },
  };
}
