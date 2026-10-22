import { format } from 'node:util';
import vm from 'node:vm';
import type { CliIo } from '../io.types.ts';
import type { HostContext, PendingQuestion, QuestionChannel } from './host-context.types.ts';
import { ASK_GLOBAL_NAME, END_OF_INPUT_CODE, QUESTION_SEPARATOR } from './repl.constants.ts';

type TimerHandle = ReturnType<typeof setTimeout>;
type ReplIo = Pick<CliIo, 'out' | 'err'>;

// O erro nasce dentro do contexto para que `e é_tipo_de Erro` valha para ele.
const END_ERROR_FACTORY = '(code) => Object.assign(new Error(code), { gsCode: code, stack: "Error: " + code })';

function createQuestionChannel(io: ReplIo, createEndError: () => Error): QuestionChannel & { ask(prompt: string): Promise<string> } {
  let pending: PendingQuestion | null = null;
  let ended = false;
  return {
    ask(prompt) {
      io.out.write(`${prompt}${QUESTION_SEPARATOR}`);
      if (ended) return Promise.reject(createEndError());
      return new Promise<string>((resolve, reject) => {
        pending = { resolve, reject };
      });
    },
    hasPending: () => pending !== null,
    answer(line) {
      const current = pending;
      pending = null;
      current?.resolve(line);
    },
    discard() {
      pending = null;
    },
    end() {
      ended = true;
      const current = pending;
      pending = null;
      current?.reject(createEndError());
    },
  };
}

function createConsole(io: ReplIo): Record<'log' | 'info' | 'warn' | 'error', (...args: readonly unknown[]) => void> {
  const toOut = (...args: readonly unknown[]): void => {
    io.out.write(`${format(...args)}\n`);
  };
  const toErr = (...args: readonly unknown[]): void => {
    io.err.write(`${format(...args)}\n`);
  };
  return { log: toOut, info: toOut, warn: toErr, error: toErr };
}

export function createHostContext(io: ReplIo): HostContext {
  let timers: readonly TimerHandle[] = [];
  const track = (handle: TimerHandle): TimerHandle => {
    timers = [...timers, handle];
    return handle;
  };
  const endErrorFactory = new vm.Script(END_ERROR_FACTORY);
  const questions = createQuestionChannel(io, () => (endErrorFactory.runInContext(context) as (code: string) => Error)(END_OF_INPUT_CODE));
  const context = vm.createContext({
    console: createConsole(io),
    setTimeout: (callback: () => void, delay?: number) => track(setTimeout(callback, delay)),
    setInterval: (callback: () => void, delay?: number) => track(setInterval(callback, delay)),
    clearTimeout: (handle: TimerHandle) => {
      clearTimeout(handle);
    },
    clearInterval: (handle: TimerHandle) => {
      clearInterval(handle);
    },
    [ASK_GLOBAL_NAME]: (prompt: unknown) => questions.ask(String(prompt)),
  });
  return {
    context,
    questions,
    dispose() {
      timers.forEach((handle) => {
        clearTimeout(handle);
        clearInterval(handle);
      });
      timers = [];
    },
  };
}
