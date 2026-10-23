import type { Cell, RunPhase, RunSignal } from './runner-client.types.ts';

const ACTIVE_PHASES: ReadonlySet<RunPhase> = new Set<RunPhase>(['running', 'asking']);

const TRANSITIONS: ReadonlyMap<RunPhase, ReadonlyMap<RunSignal, RunPhase>> = new Map([
  ['idle', new Map<RunSignal, RunPhase>([['start', 'running']])],
  [
    'running',
    new Map<RunSignal, RunPhase>([
      ['ask', 'asking'],
      ['finish', 'finished'],
      ['fail', 'failed'],
      ['timeout', 'timeout'],
      ['stop', 'stopped'],
    ]),
  ],
  [
    'asking',
    new Map<RunSignal, RunPhase>([
      ['answer', 'running'],
      ['finish', 'finished'],
      ['fail', 'failed'],
      ['timeout', 'timeout'],
      ['stop', 'stopped'],
    ]),
  ],
]);

export const isActive = (phase: RunPhase): boolean => ACTIVE_PHASES.has(phase);

export const nextPhase = (phase: RunPhase, signal: RunSignal): RunPhase => TRANSITIONS.get(phase)?.get(signal) ?? phase;

export function createCell<T>(initial: T): Cell<T> {
  let value = initial;
  return {
    get: () => value,
    set: (next) => {
      value = next;
    },
  };
}
