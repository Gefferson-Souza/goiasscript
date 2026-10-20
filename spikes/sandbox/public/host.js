const HEARTBEAT_MS = 50;
const SECRET = 'host-secret-value';
const candidate = location.pathname.replace(/^\//, '').replace(/\.html$/, '');

window.sandboxMessages = [];
window.heartbeat = { maxGap: 0 };

let last = performance.now();
setInterval(() => {
  const now = performance.now();
  window.heartbeat.maxGap = Math.max(window.heartbeat.maxGap, now - last - HEARTBEAT_MS);
  last = now;
}, HEARTBEAT_MS);

document.cookie = `secret=${SECRET}`;
localStorage.setItem('secret', SECRET);

let isolate = null;
const collect = ({ data }) => window.sandboxMessages.push(data);

async function createWorker(url) {
  const worker = new Worker(url, { type: 'module' });
  worker.onmessage = collect;
  return { post: (code) => worker.postMessage({ code }), stop: () => worker.terminate() };
}

async function createIsolate() {
  if (candidate === 'worker-blob') {
    const { RUNNER_SOURCE } = await import('/runner-source.mjs');
    return createWorker(URL.createObjectURL(new Blob([RUNNER_SOURCE], { type: 'text/javascript' })));
  }
  if (candidate === 'worker-file') return createWorker('/runner.js');
  const frame = document.createElement('iframe');
  frame.setAttribute('sandbox', 'allow-scripts');
  window.addEventListener('message', collect);
  await new Promise((resolve) => { frame.onload = resolve; frame.src = '/frame.html'; document.body.append(frame); });
  return { post: (code) => frame.contentWindow.postMessage({ code }, '*'), stop: () => frame.remove() };
}

window.start = async (code) => {
  isolate = await createIsolate();
  isolate.post(code);
};
window.stop = () => isolate?.stop();
