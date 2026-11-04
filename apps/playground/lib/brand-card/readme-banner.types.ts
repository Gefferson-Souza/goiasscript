export interface BannerFonts {
  readonly sansBold: string;
  readonly monoRegular: string;
  readonly monoBold: string;
}

export interface BannerEvent {
  readonly segment: number;
  readonly toJavaScript: boolean;
  readonly atSeconds: number;
}

export interface BannerFrames {
  readonly events: readonly BannerEvent[];
  readonly cycleSeconds: number;
  /** Coluna (em caracteres) de cada trecho depois de `state` viradas. */
  readonly columnsAt: (state: number) => readonly number[];
  readonly flippedAt: (state: number) => readonly boolean[];
  readonly textAt: (state: number) => string;
}

export interface Keyframe {
  readonly atSeconds: number;
  readonly column: number;
  readonly scale: number;
}

export interface AnimatedText {
  readonly text: string;
  readonly color: string;
  readonly bold: boolean;
  readonly keyframes: readonly Keyframe[];
}
