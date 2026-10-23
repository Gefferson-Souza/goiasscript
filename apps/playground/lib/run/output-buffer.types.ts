import type { TruncationReason } from './runner-client.types.ts';

export interface AcceptedOutput {
  readonly text: string | null;
  readonly truncated: TruncationReason | null;
}

export interface OutputBuffer {
  accept(text: string): AcceptedOutput;
}
