import type { HeroSide, SwapCue, SweepAction, SweepState, SweepStep } from './hero-code.types.ts';

interface SweepPlan {
  readonly startMs: number;
  readonly restMs: number;
  readonly instant: boolean;
}

export function otherSide(side: HeroSide): HeroSide {
  return side === 'dialect' ? 'javascript' : 'dialect';
}

export function initialSweepState(swaps: number): SweepState {
  return { flipped: Array.from({ length: swaps }, () => false), row: 0, side: 'dialect', queue: [] };
}

/** Fila de passos de uma varrida; cada atraso conta a partir do passo anterior. */
export function sweepSteps(cues: readonly SwapCue[], to: HeroSide, plan: SweepPlan): readonly SweepStep[] {
  const toJavaScript = to === 'javascript';
  const flips = cues.map((cue, index): SweepStep => ({
    kind: 'flip',
    index,
    line: cue.line,
    toJavaScript,
    delayMs: plan.instant ? 0 : cue.atMs - (cues[index - 1]?.atMs ?? cue.atMs),
  }));
  return [
    { kind: 'side', to, delayMs: plan.instant ? 0 : plan.startMs },
    ...flips,
    { kind: 'rest', delayMs: plan.instant ? 0 : plan.restMs },
  ];
}

function applyStep(state: SweepState, step: SweepStep): SweepState {
  switch (step.kind) {
    case 'side':
      return { ...state, side: step.to };
    case 'flip':
      return {
        ...state,
        row: step.line,
        flipped: state.flipped.map((value, position) => (position === step.index ? step.toJavaScript : value)),
      };
    case 'rest':
      return { ...state, row: 0 };
  }
}

export function reduceSweep(state: SweepState, action: SweepAction): SweepState {
  if (action.type === 'play') return { ...state, queue: action.steps };
  const [head, ...rest] = state.queue;
  return head === undefined ? state : { ...applyStep(state, head), queue: rest };
}
