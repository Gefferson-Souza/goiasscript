import { CSP_BLOCK, NETWORK_BLOCK, STACK_EXHAUSTED, STORAGE_ABSENT } from './expected-failures.constants.ts';
import type { HostileProgram } from './hostile-programs.types.ts';

// O mundo fechado barra os nomes de JavaScript: o ataque que compila chega ao motor pelo índice computado.
// Sem unsafe-eval o construtor já falha; a conexão bloqueada é a segunda camada se a primeira regredir.
const CONSTRUCTOR_KEY = 'uai chave é "con" mais "structor"';
const UNREACHABLE_LINES = 5000;

const BLOCKED: readonly RegExp[] = [CSP_BLOCK, NETWORK_BLOCK];

export const INFINITE_LOOP_LINE = 3;
const INFINITE_LOOP_SOURCE = 'uai a é 1\nuai b é 2\nenquanto_tiver (certeza) { }';

const attempt = (jsBody: string): string =>
  [
    CONSTRUCTOR_KEY,
    'prosa("tentei")',
    'tenta_aí {',
    `  espera_um_cadim [][chave][chave]("${jsBody}")()`,
    '} se_der_ruim (erro) {',
    '  prosa("deu ruim: " mais erro.mensagem)',
    '}',
  ].join('\n');

const settled = (setup: string): string =>
  `return new Promise(function (resolve, reject) { ${setup} setTimeout(function () { reject(new Error('Timeout')); }, 1500); });`;

const escapes: readonly HostileProgram[] = [
  { name: 'fetch', expect: 'tried-and-failed', failurePatterns: BLOCKED, source: (url) => attempt(`return fetch('${url}/fetch');`) },
  {
    name: 'XMLHttpRequest',
    expect: 'tried-and-failed',
    failurePatterns: BLOCKED,
    source: (url) =>
      attempt(settled(`var request = new XMLHttpRequest(); request.open('GET', '${url}/xhr'); request.onload = function () { resolve(request.status); }; request.onerror = function () { reject(new Error('XhrBlocked')); }; request.send();`)),
  },
  {
    name: 'WebSocket',
    expect: 'tried-and-failed',
    failurePatterns: BLOCKED,
    source: (url) =>
      attempt(settled(`var socket = new WebSocket('${url.replace('http', 'ws')}/socket'); socket.onopen = function () { resolve('open'); }; socket.onerror = function () { reject(new Error('SocketBlocked')); };`)),
  },
  { name: 'import dinâmico', expect: 'tried-and-failed', failurePatterns: BLOCKED, source: (url) => attempt(`return import('${url}/evil.js');`) },
  { name: 'importScripts', expect: 'tried-and-failed', failurePatterns: BLOCKED, source: (url) => attempt(`return importScripts('${url}/evil.js');`) },
  { name: 'sendBeacon', expect: 'tried-and-failed', failurePatterns: BLOCKED, source: (url) => attempt(`return navigator.sendBeacon('${url}/beacon', 'x');`) },
  { name: 'construtor pelo índice computado', expect: 'tried-and-failed', failurePatterns: [CSP_BLOCK], source: () => attempt('return this;') },
  { name: 'segredo do host', expect: 'tried-and-failed', failurePatterns: [CSP_BLOCK, STORAGE_ABSENT], source: () => attempt("return localStorage.getItem('segredo-do-host');") },
  { name: 'Function direto', expect: 'compile-error', source: () => 'prosa(Function("return this")())' },
  { name: 'constructor com ponto', expect: 'compile-error', source: () => 'prosa([].constructor.constructor("return this")())' },
];

const limits: readonly HostileProgram[] = [
  { name: 'laço infinito', expect: 'stopped-by-limit', source: () => INFINITE_LOOP_SOURCE },
  {
    name: 'saída gigante',
    expect: 'stopped-by-limit',
    source: () => `vai_indo (trem i é 0; i menor_que ${String(UNREACHABLE_LINES)}; i é i mais 1) {\n  prosa("linha " mais i)\n}`,
  },
  { name: 'pergunta sem resposta', expect: 'stopped-by-limit', source: () => 'uai resposta é espera_um_cadim pergunta("Quem é ocê?")\nprosa(resposta)' },
  {
    name: 'recursão sem fim',
    expect: 'tried-and-failed',
    failurePatterns: [STACK_EXHAUSTED],
    source: () => 'faz_trem desce(n) {\n  faz_favor desce(n mais 1)\n}\nprosa("tentei")\ntenta_aí {\n  desce(0)\n} se_der_ruim (erro) {\n  prosa("deu ruim: " mais erro.mensagem)\n}',
  },
];

export const HOSTILE_PROGRAMS: readonly HostileProgram[] = [...escapes, ...limits];

export function hostileSource(name: string): string {
  const program = HOSTILE_PROGRAMS.find((candidate) => candidate.name === name);
  if (program === undefined) throw new Error(`Programa hostil ausente: ${name}`);
  return program.source('');
}
