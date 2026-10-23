import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBrowserWorker } from '../lib/run/browser-worker.ts';

describe('Worker do navegador', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('carrega o runner estático como módulo', () => {
    const workerConstructor = vi.fn();
    vi.stubGlobal('Worker', workerConstructor);
    createBrowserWorker();
    expect(workerConstructor).toHaveBeenCalledWith('/sandbox/runner.js', { type: 'module' });
  });
});
