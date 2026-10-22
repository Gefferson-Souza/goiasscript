import type { TimerKind, TimerRegistry } from './host-context.types.ts';

type TimerHandle = ReturnType<typeof setTimeout>;

export function createTimerRegistry(reportError: (error: unknown) => void): TimerRegistry {
  const handles = new Map<number, TimerHandle>();
  let lastId = 0;
  const guard = (callback: (...args: readonly unknown[]) => unknown, args: readonly unknown[], afterRun: () => void, reportError: (error: unknown) => void) => (): void => {
    afterRun();
    void new Promise((resolve) => {
      resolve(callback(...args));
    }).catch(reportError);
  };
  const stop = (handle: TimerHandle): void => {
    clearTimeout(handle);
    clearInterval(handle);
  };
  return {
    schedule(kind: TimerKind, callback, delay, args) {
      lastId += 1;
      const id = lastId;
      const afterRun = kind === 'timeout' ? () => handles.delete(id) : () => undefined;
      const run = guard(callback, args, afterRun, reportError);
      handles.set(id, kind === 'timeout' ? setTimeout(run, delay) : setInterval(run, delay));
      return id;
    },
    clear(id) {
      if (typeof id !== 'number') return;
      const handle = handles.get(id);
      if (handle === undefined) return;
      stop(handle);
      handles.delete(id);
    },
    dispose() {
      handles.forEach(stop);
      handles.clear();
    },
  };
}
