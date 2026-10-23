import type { Tone } from '@goiasscript/compiler';

export const SETTINGS_SECTION = 'goiasscript';
export const TONES: readonly Tone[] = ['raiz', 'neutro'];
export const DEFAULT_TONE: Tone = 'raiz';
export const DEFAULT_DIAGNOSTICS_DELAY_MS = 300;
export const MIN_DIAGNOSTICS_DELAY_MS = 0;
export const MAX_DIAGNOSTICS_DELAY_MS = 5000;
export const LESSON_URL_PROTOCOL = 'https:';
