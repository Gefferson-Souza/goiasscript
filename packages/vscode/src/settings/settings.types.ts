import type { Tone } from '@goiasscript/compiler';

export interface ExtensionSettings {
  readonly tone: Tone;
  readonly diagnosticsDelayMs: number;
  readonly lessonBaseUrl: string | null;
}

export type RawSettings = Readonly<Record<string, unknown>>;
