import type { Tone } from '@goiasscript/compiler';

export interface ToolNoticeRequest {
  readonly code: string;
  readonly tone: Tone;
  readonly args?: Readonly<Record<string, string>>;
  readonly lines?: readonly string[];
}
