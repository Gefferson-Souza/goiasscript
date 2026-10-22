import vm from 'node:vm';
import type { HostBridge } from './host-context.types.ts';
import { ASK_GLOBAL_NAME } from './repl.constants.ts';

// Tudo que o aluno alcança nasce dentro do contexto: o ponteiro do hospedeiro fica só na closure.
const BOOTSTRAP_SOURCE = `(bridge) => {
  const scheduler = (register, name) => (callback, delay, ...args) => {
    if (typeof callback !== 'function') throw new TypeError('Ô sô! O primeiro argumento de ' + name + ' tem que ser uma função.');
    if (delay !== undefined && typeof delay !== 'number') throw new TypeError('Ô sô! O tempo de ' + name + ' tem que ser um número.');
    return register(callback, delay, args);
  };
  const writer = (sink) => (...args) => { sink(args); };
  globalThis.console = Object.freeze({ log: writer(bridge.out), info: writer(bridge.out), warn: writer(bridge.err), error: writer(bridge.err) });
  globalThis.setTimeout = scheduler(bridge.setTimeout, 'daqui_um_cadim');
  globalThis.setInterval = scheduler(bridge.setInterval, 'toda_hora');
  globalThis.clearTimeout = (id) => { bridge.clear(id); };
  globalThis.clearInterval = globalThis.clearTimeout;
  globalThis[${JSON.stringify(ASK_GLOBAL_NAME)}] = async (prompt) => bridge.ask(String(prompt));
}`;

export function installHostGlobals(context: vm.Context, bridge: HostBridge): void {
  const install = new vm.Script(BOOTSTRAP_SOURCE).runInContext(context) as (bridge: HostBridge) => void;
  install(bridge);
}
