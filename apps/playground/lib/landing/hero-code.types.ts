export type SameTone = 'plain' | 'string' | 'number';

export interface SameSegment {
  readonly kind: 'same';
  readonly text: string;
  readonly tone: SameTone;
}

export interface SwapSegment {
  readonly kind: 'swap';
  readonly dialect: string;
  readonly javascript: string;
}

export type HeroSegment = SameSegment | SwapSegment;

export type HeroLine = readonly HeroSegment[];

export type HeroSide = 'dialect' | 'javascript';

export interface SwapCue {
  readonly line: number;
  readonly swap: number;
  readonly atMs: number;
}

export interface HeroSweep {
  readonly flipped: readonly boolean[];
  readonly row: number;
  readonly side: HeroSide;
  readonly flip: () => void;
}

export type SweepStep =
  | { readonly kind: 'side'; readonly to: HeroSide; readonly delayMs: number }
  | { readonly kind: 'flip'; readonly index: number; readonly line: number; readonly toJavaScript: boolean; readonly delayMs: number }
  | { readonly kind: 'rest'; readonly delayMs: number };

export interface SweepState {
  readonly flipped: readonly boolean[];
  readonly row: number;
  readonly side: HeroSide;
  readonly queue: readonly SweepStep[];
}

export type SweepAction = { readonly type: 'play'; readonly steps: readonly SweepStep[] } | { readonly type: 'advance' };
