import type { Tone } from '@goiasscript/compiler';
import { DEFAULT_DIAGNOSTICS_DELAY_MS, DEFAULT_TONE, LESSON_URL_PROTOCOL, MAX_DIAGNOSTICS_DELAY_MS, MIN_DIAGNOSTICS_DELAY_MS, TONES } from './settings.constants.ts';
import type { ExtensionSettings, RawSettings } from './settings.types.ts';

function readTone(value: unknown): Tone {
  return TONES.find((tone) => tone === value) ?? DEFAULT_TONE;
}

function readDelay(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return DEFAULT_DIAGNOSTICS_DELAY_MS;
  return Math.min(MAX_DIAGNOSTICS_DELAY_MS, Math.max(MIN_DIAGNOSTICS_DELAY_MS, Math.round(value)));
}

function readLessonBaseUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return URL.canParse(trimmed) && new URL(trimmed).protocol === LESSON_URL_PROTOCOL ? trimmed : null;
}

export function readSettings(raw: RawSettings): ExtensionSettings {
  return {
    tone: readTone(raw['tone']),
    diagnosticsDelayMs: readDelay(raw['diagnosticsDelayMs']),
    lessonBaseUrl: readLessonBaseUrl(raw['lessonBaseUrl']),
  };
}
