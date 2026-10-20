// Roda dentro do isolamento (Worker de módulo ou iframe): executa o programa por import() de um blob.
export const RUNNER_SOURCE = `
globalThis.report = (message) => (typeof parent === 'undefined' ? self.postMessage(message) : parent.postMessage(message, '*'));
addEventListener('message', async ({ data }) => {
  try {
    await import(URL.createObjectURL(new Blob([data.code], { type: 'text/javascript' })));
    report({ type: 'done' });
  } catch (error) {
    report({ type: 'error', name: String(error?.name), stack: String(error?.stack) });
  }
});
`;
