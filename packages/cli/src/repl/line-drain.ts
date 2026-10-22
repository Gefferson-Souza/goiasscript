import type { LineDrain, LineDrainHooks } from './line-drain.types.ts';

export function createLineDrain(hooks: LineDrainHooks): LineDrain {
  let queue: readonly string[] = [];
  let running: Promise<void> | null = null;
  const run = async (): Promise<void> => {
    while (queue.length > 0 && !hooks.isStopped()) {
      const [line = '', ...rest] = queue;
      queue = rest;
      hooks.onLine();
      await hooks.processLine(line);
    }
    running = null;
    hooks.onIdle();
  };
  return {
    push(line) {
      queue = [...queue, line];
      running ??= run();
    },
    take() {
      const [first, ...rest] = queue;
      queue = rest;
      return first;
    },
    current: () => running,
  };
}
