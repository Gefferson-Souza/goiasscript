import type { LineDrain, LineDrainHooks } from './line-drain.types.ts';

export function createLineDrain(hooks: LineDrainHooks): LineDrain {
  let queue: string[] = [];
  let head = 0;
  let running: Promise<void> | null = null;
  const take = (): string | undefined => {
    const next = queue[head];
    if (next === undefined) return undefined;
    head += 1;
    if (head === queue.length) {
      queue = [];
      head = 0;
    }
    return next;
  };
  const run = async (): Promise<void> => {
    while (head < queue.length && !hooks.isStopped()) {
      const line = take() ?? '';
      hooks.onLine();
      await hooks.processLine(line);
    }
    running = null;
    hooks.onIdle();
  };
  return {
    push(line) {
      queue.push(line);
      running ??= run();
    },
    take,
    current: () => running,
  };
}
