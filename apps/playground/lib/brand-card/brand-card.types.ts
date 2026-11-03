export interface CardSize {
  readonly width: number;
  readonly height: number;
}

export interface CodeToken {
  readonly text: string;
  readonly color: string;
  readonly keyword: boolean;
}

export type FontWeight = 400 | 700;

export interface CardFont {
  readonly name: string;
  readonly data: ArrayBuffer;
  readonly weight: FontWeight;
  readonly style: 'normal';
}
