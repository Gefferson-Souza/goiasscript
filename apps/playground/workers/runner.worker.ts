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

  // Defesa em profundidade. O isolamento REAL é dado pela CSP do site
  // (connect-src 'self' bloqueia exfiltração; script-src 'self' bloqueia
  // importScripts externo) + o worker rodar sem credenciais/DOM. Aqui só
  // levantamos a barra: sombreamos os globais perigosos passando-os como
  // parâmetros que lançam erro se tocados. O hard timeout fica no main
  // thread via worker.terminate().
  const blocked = new Proxy(Object.create(null), {
    get() {
      throw new Error('Acesso negado nesse trem aqui no playground, sô.');
    },
    apply() {
      throw new Error('Acesso negado nesse trem aqui no playground, sô.');
    },
  });
  const DANGEROUS = [
    'self',
    'globalThis',
    'fetch',
    'XMLHttpRequest',
    'WebSocket',
    'importScripts',
    'indexedDB',
    'caches',
    'Worker',
    'SharedWorker',
    'EventSource',
  ];
  // eslint-disable-next-line no-new-func
  const fn = new Function('console', ...DANGEROUS, `"use strict"; ${jsCode}`);
  fn(stubConsole, ...DANGEROUS.map(() => blocked));
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
