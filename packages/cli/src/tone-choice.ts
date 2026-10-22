import type { Tone } from '@goiasscript/compiler';

export const chooseByTone = <T>(tone: Tone, root: T, neutral: T): T => (tone === 'raiz' ? root : neutral);
