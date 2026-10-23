import { MESSAGE_TYPES } from './protocol.constants.ts';
import type { RunnerPort } from './protocol.types.ts';
import { isExecuteMessage, runProgram } from './run-program.ts';

const port: RunnerPort = { postMessage: (message) => {
    globalThis.postMessage(message);
  },
};

// Cada Worker executa um único programa: o host cria outro Worker a cada execução.
let started = false;

globalThis.addEventListener('message', (event: MessageEvent<unknown>) => {
  if (started || !isExecuteMessage(event.data)) return;
  started = true;
  void runProgram(port, event.data, { scope: globalThis, importModule: (url) => import(/* webpackIgnore: true */ url) });
});

port.postMessage({ type: MESSAGE_TYPES.ready });
