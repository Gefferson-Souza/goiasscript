import { describe, expect, it } from 'vitest';
import type { SwapCue, SweepState } from '../lib/landing/hero-code.types.ts';
import { initialSweepState, otherSide, reduceSweep, sweepSteps } from '../lib/landing/hero-sweep.ts';

const CUES: readonly SwapCue[] = [
  { line: 0, swap: 0, atMs: 0 },
  { line: 0, swap: 1, atMs: 60 },
  { line: 2, swap: 0, atMs: 400 },
];
const REST_MS = 300;

function runAll(state: SweepState): SweepState {
  return state.queue.reduce((current) => reduceSweep(current, { type: 'advance' }), state);
}

describe('passos da varrida', () => {
  it('anuncia o lado, vira cada troca no intervalo das deixas e descansa no fim', () => {
    expect(sweepSteps(CUES, 'javascript', { startMs: 900, restMs: REST_MS, instant: false })).toEqual([
      { kind: 'side', to: 'javascript', delayMs: 900 },
      { kind: 'flip', index: 0, line: 0, toJavaScript: true, delayMs: 0 },
      { kind: 'flip', index: 1, line: 0, toJavaScript: true, delayMs: 60 },
      { kind: 'flip', index: 2, line: 2, toJavaScript: true, delayMs: 340 },
      { kind: 'rest', delayMs: REST_MS },
    ]);
  });

  it('sem animação, tudo vira de uma vez', () => {
    const steps = sweepSteps(CUES, 'dialect', { startMs: 0, restMs: REST_MS, instant: true });
    expect(steps.every((step) => step.delayMs === 0)).toBe(true);
    expect(steps.filter((step) => step.kind === 'flip').every((step) => !step.toJavaScript)).toBe(true);
  });
});

describe('estado da vitrine', () => {
  it('começa em goianês, nada virado, sem fila', () => {
    expect(initialSweepState(3)).toEqual({ flipped: [false, false, false], row: 0, side: 'dialect', queue: [] });
  });

  it('depois de rodar a fila inteira tá tudo em JavaScript e o cursor volta pro topo', () => {
    const played = reduceSweep(initialSweepState(3), { type: 'play', steps: sweepSteps(CUES, 'javascript', { startMs: 0, restMs: REST_MS, instant: false }) });
    const done = runAll(played);
    expect(done).toEqual({ flipped: [true, true, true], row: 0, side: 'javascript', queue: [] });
  });

  it('o cursor acompanha a linha da troca', () => {
    const played = reduceSweep(initialSweepState(3), { type: 'play', steps: sweepSteps(CUES, 'javascript', { startMs: 0, restMs: REST_MS, instant: false }) });
    const afterThree = [1, 2, 3, 4].reduce((state) => reduceSweep(state, { type: 'advance' }), played);
    expect(afterThree.row).toBe(2);
  });

  it('tocar uma nova varrida troca a fila inteira sem desfazer o que já virou', () => {
    const half = reduceSweep(
      reduceSweep(reduceSweep(initialSweepState(3), { type: 'play', steps: sweepSteps(CUES, 'javascript', { startMs: 0, restMs: REST_MS, instant: true }) }), { type: 'advance' }),
      { type: 'advance' },
    );
    expect(half.flipped).toEqual([true, false, false]);
    const back = runAll(reduceSweep(half, { type: 'play', steps: sweepSteps(CUES, 'dialect', { startMs: 0, restMs: REST_MS, instant: true }) }));
    expect(back.flipped).toEqual([false, false, false]);
    expect(back.side).toBe('dialect');
  });

  it('avançar com a fila vazia não muda nada', () => {
    const state = initialSweepState(2);
    expect(reduceSweep(state, { type: 'advance' })).toBe(state);
  });

  it('o outro lado do goianês é o JavaScript e vice-versa', () => {
    expect(otherSide('dialect')).toBe('javascript');
    expect(otherSide('javascript')).toBe('dialect');
  });
});
