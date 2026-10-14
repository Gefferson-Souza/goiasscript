// Reprodução FIEL da lógica de runUser() de apps/playground/workers/runner.worker.ts (linhas 27-76)
// dentro de um worker_threads, usando o transpilador REAL do core. Prova a semântica do V8
// (Function/AsyncFunction/constructor.constructor/eval indireto); NÃO prova CSP/comportamento de browser.
import { Worker, isMainThread, parentPort } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const CORE = '<repo>/packages/core/src/browser.js';

if (isMainThread) {
  const cases = [
    ['T0 controle: fetch direto', 'fetch("http://127.0.0.1:1/x")'],
    ['T1 Function("return this")()', 'uai G é Function("return this")(); prosa("typeof G.fetch =", typeof G.fetch, "| typeof G.process =", typeof G.process, "| G é o global real?", G.constructor === Object || String(G).slice(0,15));'],
    ['T2 AsyncFunction.constructor (+await)', '(async function(){}).constructor("return this")().then(g => prosa("via AsyncFunction -> typeof g.fetch =", typeof g.fetch))'],
    ['T3 [].constructor.constructor', 'uai G é [].constructor.constructor("return this")(); prosa("via [].constructor.constructor -> typeof G.fetch =", typeof G.fetch)'],
    ['T4 (()=>{}).constructor', 'uai G é (()=>{}).constructor("return this")(); prosa("via arrow.constructor -> typeof G.fetch =", typeof G.fetch)'],
    ['T5 Object.constructor', 'uai G é Object.constructor("return this")(); prosa("via Object.constructor -> typeof G.fetch =", typeof G.fetch)'],
    ['T6 eval indireto (0,eval)', 'uai G é (0, eval)("this"); prosa("via eval indireto -> typeof G.fetch =", typeof G.fetch)'],
    ['T7 eval DIRETO (controle)', 'uai G é eval("this"); prosa("eval direto, this =", typeof G)'],
    ['T8 this no topo (controle)', 'prosa("this no topo =", typeof this)'],
    ['T9 globalThis (controle)', 'prosa(globalThis.constructor)'],
    ['T10 import() dinâmico (data:)', 'import("data:text/javascript,export default globalThis").then(m => prosa("via import() -> typeof m.default.fetch =", typeof m.default.fetch)).catch(e => prosa("import() falhou:", e.message))'],
    ['T11 postMessage global NÃO sombreado', 'prosa("typeof postMessage/close/setTimeout:", typeof setTimeout, typeof queueMicrotask, typeof structuredClone)'],
  ];
  let i = 0;
  const next = () => {
    if (i >= cases.length) return;
    const [nome, src] = cases[i++];
    const w = new Worker(fileURLToPath(import.meta.url), { workerData: null });
    w.on('message', (m) => {
      if (m.type === 'log') console.log(`  [${nome}] log:`, m.parts.join(' '));
      else { console.log(`  [${nome}] ->`, m.type, m.message ?? m.error ?? ''); setTimeout(() => w.terminate(), 150); }
    });
    w.on('error', (e) => console.log(`  [${nome}] worker error:`, e.message));
    w.on('exit', () => next());
    w.postMessage({ src });
  };
  next();
} else {
  const require = createRequire(import.meta.url);
  const { GoiasScriptBrowserCompiler } = require(CORE);
  const compiler = new GoiasScriptBrowserCompiler();

  function formatArg(v) { return typeof v === 'string' ? v : (() => { try { return JSON.stringify(v, null, 2); } catch { return String(v); } })(); }

  // ---- CÓPIA de runUser (linhas 27-76 do runner.worker.ts), trocando só self.postMessage ----
  function runUser(jsCode, logs) {
    const record = (level, args) => { const entry = { level, parts: args.map(formatArg) }; logs.push(entry); parentPort.postMessage({ type: 'log', ...entry }); };
    const stubConsole = { log: (...a) => record('log', a), warn: (...a) => record('warn', a), error: (...a) => record('error', a), info: (...a) => record('log', a), debug: (...a) => record('log', a) };
    const negado = () => { throw new Error('Acesso negado nesse trem aqui no playground, sô.'); };
    const blocked = new Proxy(negado, { get: negado, apply: negado, construct: negado });
    const DANGEROUS = ['self','globalThis','fetch','XMLHttpRequest','WebSocket','importScripts','indexedDB','caches','Worker','SharedWorker','EventSource'];
    const fn = new Function('console', ...DANGEROUS, `"use strict"; ${jsCode}`);
    fn(stubConsole, ...DANGEROUS.map(() => blocked));
  }
  // ------------------------------------------------------------------------------------------
  parentPort.on('message', ({ src }) => {
    const result = compiler.transpile(src, 'probe.gs');
    if (!result.success) { parentPort.postMessage({ type: 'compile-error', error: result.error?.message }); return; }
    try { runUser(result.code, []); parentPort.postMessage({ type: 'ok' }); }
    catch (err) { parentPort.postMessage({ type: 'runtime-error', message: err instanceof Error ? err.message : String(err) }); }
  });
}
