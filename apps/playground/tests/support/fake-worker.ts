import type { WorkerPort } from '../../lib/run/runner-client.types.ts';
import type { HostToRunner } from '../../sandbox/protocol.types.ts';

export class FakeWorker implements WorkerPort {
  onmessage: ((event: MessageEvent<unknown>) => void) | null = null;
  readonly posted: HostToRunner[] = [];
  terminateCount = 0;

  get terminated(): boolean {
    return this.terminateCount > 0;
  }

  postMessage(message: HostToRunner): void {
    this.posted.push(message);
  }

  terminate(): void {
    this.terminateCount += 1;
  }

  emit(data: unknown): void {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
}

interface PendingTimer {
  readonly at: number;
  readonly handler: () => void;
}

export class FakeTimers {
  private current = 0;
  private nextId = 1;
  private readonly pending = new Map<number, PendingTimer>();

  now = (): number => this.current;

  get pendingCount(): number {
    return this.pending.size;
  }

  setTimeout = (handler: () => void, delayMs: number): number => {
    const id = this.nextId;
    this.nextId += 1;
    this.pending.set(id, { at: this.current + delayMs, handler });
    return id;
  };

  clearTimeout = (handle: unknown): void => {
    this.pending.delete(handle as number);
  };

  advance(ms: number): void {
    const target = this.current + ms;
    for (;;) {
      const due = [...this.pending.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (due === undefined) break;
      this.pending.delete(due[0]);
      this.current = Math.max(this.current, due[1].at);
      due[1].handler();
    }
    this.current = target;
  }
}
