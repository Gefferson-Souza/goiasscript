import type { CompileSuccess, Tone } from '@goiasscript/compiler';

export interface RunRequest {
  readonly result: CompileSuccess;
  readonly source: string;
  readonly displayName: string;
  readonly tone: Tone;
}
