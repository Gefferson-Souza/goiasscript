export type FrameKind = 'program' | 'function' | 'arrow' | 'method' | 'constructor';

export interface Frame {
  readonly kind: FrameKind;
  readonly async: boolean;
  readonly loopDepth: number;
  readonly classHasParent: boolean;
  readonly thisUsed: boolean;
}

export interface FrameSpec {
  readonly kind: FrameKind;
  readonly async: boolean;
  readonly classHasParent?: boolean;
}
