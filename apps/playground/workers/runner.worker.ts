/// <reference lib="webworker" />
// Web Worker que transpila e executa GoiásScript isolado do main thread.
// Não toca DOM, não toca window. Hard timeout fica do lado do main thread
// (chama worker.terminate() se passar do limite).

import { GoiasScriptBrowserCompiler } from 'goiasscript/browser';

type RunMessage = { type: 'run'; code: string };
type InMessage = RunMessage;

type LogEntry = { level: 'log' | 'warn' | 'error'; parts: string[] };

const compiler = new GoiasScriptBrowserCompiler();

function formatArg(v: unknown): string {
  if (v === null) return 'nada';
  if (v === undefined) return 'indefinido';
  if (typeof v === 'string') return v;
  if (typeof v === 'function') return `[faz_trem ${(v as { name?: string }).name || 'anônima'}]`;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function runUser(jsCode: string, logs: LogEntry[]): void {
  const stubConsole = {
    log: (...args: unknown[]) => logs.push({ level: 'log', parts: args.map(formatArg) }),
    warn: (...args: unknown[]) => logs.push({ level: 'warn', parts: args.map(formatArg) }),
    error: (...args: unknown[]) => logs.push({ level: 'error', parts: args.map(formatArg) }),
    info: (...args: unknown[]) => logs.push({ level: 'log', parts: args.map(formatArg) }),
    debug: (...args: unknown[]) => logs.push({ level: 'log', parts: args.map(formatArg) }),
  };

  // Executa num escopo controlado. `new Function` com `console` injetado
  // evita acesso ao `self`/`globalThis` do worker (não é sandbox 100%, mas
  // joga o usuário num escopo limpo o suficiente para o playground).
  // O timeout fica por conta do main thread via worker.terminate().
  // eslint-disable-next-line no-new-func
  const fn = new Function('console', `"use strict"; ${jsCode}`);
  fn(stubConsole);
}

self.addEventListener('message', (event: MessageEvent<InMessage>) => {
  const msg = event.data;
  if (msg.type !== 'run') return;

  const result = compiler.transpile(msg.code, 'playground.gs');
  if (!result.success || !result.code) {
    self.postMessage({
      type: 'compile-error',
      error: result.error?.message || 'Ô rapaz! Deu ruim na tradução',
    });
    return;
  }

  const js: string = result.code;
  const logs: LogEntry[] = [];
  try {
    runUser(js, logs);
    self.postMessage({ type: 'ok', logs, js, warnings: result.warnings || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ type: 'runtime-error', message, logs, js });
  }
});

export {};
