import { parseArgs } from 'node:util';
import type { Tone } from '@goiasscript/compiler';
import { toPrintable } from '../args/printable-text.ts';
import { lastToneValue } from '../args/tone-argument.ts';
import type { ReplArguments } from './repl-arguments.types.ts';

const TONES: readonly string[] = ['raiz', 'neutro'];
const TONE_FLAG = 'tom';
const isTone = (value: string): value is Tone => TONES.includes(value);

export function parseReplArguments(argv: readonly string[]): ReplArguments {
  const { tokens } = parseArgs({ args: [...argv], options: { [TONE_FLAG]: { type: 'string' } }, strict: false, allowPositionals: true, tokens: true });
  const stray = tokens.find((token) => (token.kind === 'option' && token.name !== TONE_FLAG) || token.kind === 'positional');
  if (stray?.kind === 'positional') return { ok: false, detail: `A roda de prosa não recebe "${toPrintable(stray.value)}"; ela só aceita "--tom".` };
  if (stray?.kind === 'option') return { ok: false, detail: `A opção "${toPrintable(stray.rawName)}" não existe na roda de prosa; ela só aceita "--tom".` };
  const tone = lastToneValue(argv) ?? 'raiz';
  if (!isTone(tone)) return { ok: false, detail: `O tom "${toPrintable(tone)}" não existe; use "raiz" ou "neutro".` };
  return { ok: true, tone };
}
