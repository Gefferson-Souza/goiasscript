import type { HeroLine, HeroSegment } from '../landing/hero-code.types.ts';
import { BACK_START_SECONDS, CYCLE_SECONDS, FORWARD_START_SECONDS, SWEEP_SECONDS } from './readme-banner.constants.ts';
import type { BannerEvent, BannerFrames } from './readme-banner.types.ts';

function segmentText(segment: HeroSegment, flipped: boolean): string {
  if (segment.kind === 'same') return segment.text;
  return flipped ? segment.javascript : segment.dialect;
}

function columns(line: HeroLine, flipped: readonly boolean[]): readonly number[] {
  const widths = line.map((segment, index) => segmentText(segment, flipped[index] ?? false).length);
  return widths.map((_width, index) => widths.slice(0, index).reduce((total, width) => total + width, 0));
}

function lineLength(line: HeroLine, flipped: readonly boolean[]): number {
  return line.map((segment, index) => segmentText(segment, flipped[index] ?? false)).join('').length;
}

// A ida vira da esquerda pra direita no compasso do cursor; a volta faz o mesmo partindo do JavaScript.
function sweepEvents(line: HeroLine, swaps: readonly number[], toJavaScript: boolean): readonly BannerEvent[] {
  const flipped = line.map(() => !toJavaScript);
  const at = columns(line, flipped);
  const length = lineLength(line, flipped);
  const start = toJavaScript ? FORWARD_START_SECONDS : BACK_START_SECONDS;
  return swaps.map((segment) => ({ segment, toJavaScript, atSeconds: start + (SWEEP_SECONDS * (at[segment] ?? 0)) / length }));
}

/** Estados e momentos da animação do banner: cada troca vira na ida e desvira na volta. */
export function bannerFrames(line: HeroLine): BannerFrames {
  const swaps = line.flatMap((segment, index) => (segment.kind === 'swap' ? [index] : []));
  const events = [...sweepEvents(line, swaps, true), ...sweepEvents(line, swaps, false)];
  const flippedAt = (state: number): readonly boolean[] =>
    line.map((_segment, index) => events.slice(0, state).reduce((flipped, event) => (event.segment === index ? event.toJavaScript : flipped), false));
  return {
    events,
    cycleSeconds: CYCLE_SECONDS,
    flippedAt,
    columnsAt: (state) => columns(line, flippedAt(state)),
    textAt: (state) => line.map((segment, index) => segmentText(segment, flippedAt(state)[index] ?? false)).join(''),
  };
}
