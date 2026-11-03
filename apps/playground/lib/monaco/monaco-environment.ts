import { EDITOR_WORKER_FILE, MONACO_BASE_PATH } from './monaco-assets';
import type { MonacoWorkerEnvironment, WorkerFactory } from './monaco-environment.types';

// Sem isso o Monaco embrulha o worker num blob:, que a CSP (worker-src 'self') barra.
// O playground só usa o worker do editor: a linguagem GoiásScript roda na página.
export function createMonacoEnvironment(createWorker: WorkerFactory): MonacoWorkerEnvironment {
  const url = `${MONACO_BASE_PATH}/${EDITOR_WORKER_FILE}`;
  return { getWorker: (_moduleId, label) => createWorker(url, { type: 'module', name: label }) };
}
