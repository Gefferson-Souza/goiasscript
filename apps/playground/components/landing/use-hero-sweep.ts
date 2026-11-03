'use client';
import { useCallback, useEffect, useMemo, useReducer } from 'react';
import { HERO_TIMING } from '@/lib/landing/hero-code.constants';
import { sweepCues } from '@/lib/landing/hero-code';
import type { HeroLine, HeroSweep } from '@/lib/landing/hero-code.types';
import { initialSweepState, otherSide, reduceSweep, sweepSteps } from '@/lib/landing/hero-sweep';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

function prefersReducedMotion(): boolean {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

/** Cursor desce o código e vira cada palavra goiana no JavaScript correspondente, no lugar. */
export function useHeroSweep(lines: readonly HeroLine[]): HeroSweep {
  const cues = useMemo(() => sweepCues(lines, HERO_TIMING), [lines]);
  const [state, dispatch] = useReducer(reduceSweep, cues.length, initialSweepState);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const animated = { restMs: HERO_TIMING.lineMs, instant: false };
    dispatch({
      type: 'play',
      steps: [
        ...sweepSteps(cues, 'javascript', { ...animated, startMs: HERO_TIMING.startDelayMs }),
        ...sweepSteps(cues, 'dialect', { ...animated, startMs: HERO_TIMING.holdMs }),
      ],
    });
  }, [cues]);

  const [nextStep] = state.queue;
  useEffect(() => {
    if (nextStep === undefined) return;
    const timer = window.setTimeout(() => {
      dispatch({ type: 'advance' });
    }, nextStep.delayMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [nextStep]);

  const flip = useCallback(() => {
    const target = otherSide(state.side);
    dispatch({ type: 'play', steps: sweepSteps(cues, target, { startMs: 0, restMs: HERO_TIMING.lineMs, instant: prefersReducedMotion() }) });
  }, [cues, state.side]);

  return { flipped: state.flipped, row: state.row, side: state.side, flip };
}
