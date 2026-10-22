import { FIELDS_WITH_ORIGIN } from './source-map.constants.ts';
import type { DecodedSegment } from './vlq.types.ts';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const CONTINUATION = 0b100000;
const PAYLOAD_MASK = 0b11111;
const PAYLOAD_BITS = 5;
const SIGN_BIT = 1;

export function encodeVlq(value: number): string {
  let remaining = value < 0 ? (-value << SIGN_BIT) | SIGN_BIT : value << SIGN_BIT;
  let out = '';
  do {
    const digit = remaining & PAYLOAD_MASK;
    remaining >>>= PAYLOAD_BITS;
    out += BASE64.charAt(remaining > 0 ? digit | CONTINUATION : digit);
  } while (remaining > 0);
  return out;
}

const BASE64_INDEX: ReadonlyMap<string, number> = new Map(Array.from(BASE64, (char, index) => [char, index] as const));

interface VlqState {
  readonly values: readonly number[];
  readonly accumulator: number;
  readonly shift: number;
}

const INITIAL_VLQ_STATE: VlqState = { values: [], accumulator: 0, shift: 0 };

// Um segmento tem poucos campos, então copiar `values` a cada dígito fechado custa quase nada.
function readDigit(state: VlqState, char: string): VlqState {
  const digit = BASE64_INDEX.get(char) ?? 0;
  const accumulator = state.accumulator + ((digit & PAYLOAD_MASK) << state.shift);
  if ((digit & CONTINUATION) !== 0) return { ...state, accumulator, shift: state.shift + PAYLOAD_BITS };
  const value = (accumulator & 1) === 1 ? -(accumulator >>> 1) : accumulator >>> 1;
  return { values: [...state.values, value], accumulator: 0, shift: 0 };
}

export const decodeVlqFields = (raw: string): readonly number[] => Array.from(raw).reduce(readDigit, INITIAL_VLQ_STATE).values;

export function decodeMappings(mappings: string): readonly (readonly DecodedSegment[])[] {
  let originalLine = 0;
  let originalColumn = 0;
  return mappings.split(';').map((line) => {
    let generatedColumn = 0;
    return line === '' ? [] : line.split(',').map((raw): DecodedSegment => {
      const fields = decodeVlqFields(raw);
      generatedColumn += fields[0] ?? 0;
      if (fields.length < FIELDS_WITH_ORIGIN) return { generatedColumn, originalLine: null, originalColumn: null };
      originalLine += fields[2] ?? 0;
      originalColumn += fields[3] ?? 0;
      return { generatedColumn, originalLine, originalColumn };
    });
  });
}
