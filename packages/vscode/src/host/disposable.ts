import type { Disposable } from './extension-host.types.ts';

export function emptyDisposable(): Disposable {
  return {
    dispose: () => undefined,
  };
}
