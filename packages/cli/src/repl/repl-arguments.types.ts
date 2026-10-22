import type { Tone } from '@goiasscript/compiler';

export type ReplArguments = { readonly ok: true; readonly tone: Tone } | { readonly ok: false; readonly detail: string };
