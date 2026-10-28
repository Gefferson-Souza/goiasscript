import { RUNTIME_PHRASES } from '@goiasscript/language';
import type { MessagePhrases } from './message-source.types.ts';

const GENERIC_CODE_BY_CLASS = { TypeError: 'GS0710', ReferenceError: 'GS0711', RangeError: 'GS0712', InternalError: 'GS0712', SyntaxError: 'GS0713' } as const;
const MARKER_CODES = ['GS0701', 'GS0702', 'GS0703'] as const;

const phraseOf = (code: string): string => RUNTIME_PHRASES[code] ?? '';

export const phrasesFromCatalog = (): MessagePhrases => ({
  generic: Object.fromEntries(Object.entries(GENERIC_CODE_BY_CLASS).map(([name, code]) => [name, phraseOf(code)])),
  codes: Object.fromEntries(MARKER_CODES.map((code) => [code, phraseOf(code)])),
});

export const buildMessageSource = (phrases: MessagePhrases): string => `function $gs_mensagem(e) {
  const p = ${JSON.stringify(phrases)};
  if (e && typeof e.gsCode === 'string' && Object.hasOwn(p.codes, e.gsCode)) return p.codes[e.gsCode].replace(/\\[\\[(.*?)\\]\\]/gu, (_m, inner) => typeof e.gsLine === 'number' ? inner : '').replace('{line}', String(e.gsLine));
  if (e && typeof e.name === 'string' && Object.hasOwn(p.generic, e.name)) return p.generic[e.name];
  return e && typeof e.message === 'string' ? e.message : String(e);
}`;
