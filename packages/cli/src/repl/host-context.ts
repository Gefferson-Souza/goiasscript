import { format } from 'node:util';
import vm from 'node:vm';
import type { Tone } from '@goiasscript/compiler';
import type { CliIo } from '../io.types.ts';
import { installHostGlobals } from './host-bootstrap.ts';
import type { HostContext } from './host-context.types.ts';
import { createQuestionChannel } from './question-channel.ts';
import { createAsyncErrorReporter } from './report-async-error.ts';
import { END_OF_INPUT_CODE } from './repl.constants.ts';
import { createTimerRegistry } from './timer-registry.ts';

type ReplIo = Pick<CliIo, 'out' | 'err'>;

// O erro nasce dentro do contexto para que `e é_tipo_de Erro` valha para ele.
const END_ERROR_FACTORY = '(code) => Object.assign(new Error(code), { gsCode: code, stack: "Error: " + code })';

// A saída de prosa() é do programa do usuário e segue sem filtro; só o eco e as listagens da sessão são escapados.
const lineWriter = (sink: ReplIo['out']) => (args: readonly unknown[]): void => {
  sink.write(`${format(...args)}\n`);
};

export function createHostContext(io: ReplIo, tone: Tone, onAsked: () => void): HostContext {
  const context = vm.createContext({});
  const endErrorFactory = new vm.Script(END_ERROR_FACTORY);
  const questions = createQuestionChannel(io, () => (endErrorFactory.runInContext(context) as (code: string) => Error)(END_OF_INPUT_CODE), onAsked);
  const timers = createTimerRegistry(createAsyncErrorReporter(io, tone));
  installHostGlobals(context, {
    out: lineWriter(io.out),
    err: lineWriter(io.err),
    setTimeout: (callback, delay, args) => timers.schedule('timeout', callback, delay, args),
    setInterval: (callback, delay, args) => timers.schedule('interval', callback, delay, args),
    clear: (id) => {
      timers.clear(id);
    },
    ask: (prompt) => questions.ask(prompt),
  });
  return { context, questions, dispose: () => { timers.dispose(); } };
}
