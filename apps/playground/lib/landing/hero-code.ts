import type { HeroLine, HeroSegment, HeroSide, SwapCue } from './hero-code.types.ts';

interface SweepTiming {
  readonly lineMs: number;
  readonly swapGapMs: number;
  readonly emptyLineMs: number;
}

function segmentText(segment: HeroSegment, side: HeroSide): string {
  if (segment.kind === 'same') return segment.text;
  return side === 'dialect' ? segment.dialect : segment.javascript;
}

export function renderSide(lines: readonly HeroLine[], side: HeroSide): string {
  return lines.map((line) => line.map((segment) => segmentText(segment, side)).join('')).join('\n');
}

export function swapCount(lines: readonly HeroLine[]): number {
  return lines.reduce((total, line) => total + line.filter((segment) => segment.kind === 'swap').length, 0);
}

/** Momento em que cada troca vira enquanto o cursor desce linha por linha. */
export function sweepCues(lines: readonly HeroLine[], timing: SweepTiming): readonly SwapCue[] {
  const lineDuration = (line: HeroLine): number => (swapCount([line]) === 0 ? timing.emptyLineMs : timing.lineMs);
  const lineStarts = lines.map((_line, index) => lines.slice(0, index).reduce((total, line) => total + lineDuration(line), 0));
  return lines.flatMap((line, lineIndex) =>
    line
      .filter((segment) => segment.kind === 'swap')
      .map((_segment, swapIndex) => ({ line: lineIndex, swap: swapIndex, atMs: (lineStarts[lineIndex] ?? 0) + swapIndex * timing.swapGapMs })),
  );
}
