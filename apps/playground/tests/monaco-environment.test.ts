import { describe, expect, it } from 'vitest';
import { EDITOR_WORKER_FILE, MONACO_BASE_PATH } from '../lib/monaco/monaco-assets.ts';
import { createMonacoEnvironment } from '../lib/monaco/monaco-environment.ts';
import type { WorkerFactory } from '../lib/monaco/monaco-environment.types.ts';

describe('createMonacoEnvironment', () => {
  it('cria o worker como módulo da própria origem, que a CSP aceita', () => {
    const calls: { readonly url: string; readonly options: WorkerOptions }[] = [];
    const fakeWorker = {} as Worker;
    const factory: WorkerFactory = (url, options) => {
      calls.push({ url, options });
      return fakeWorker;
    };
    const worker = createMonacoEnvironment(factory).getWorker('workerMain.js', 'editorWorkerService');
    expect(worker).toBe(fakeWorker);
    expect(calls).toEqual([{ url: `${MONACO_BASE_PATH}/${EDITOR_WORKER_FILE}`, options: { type: 'module', name: 'editorWorkerService' } }]);
  });
});
