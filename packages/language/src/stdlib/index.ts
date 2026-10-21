import { DATE_ENTRIES } from './date.data.ts';
import { ERROR_ENTRIES } from './error.data.ts';
import { IO_ENTRIES } from './io.data.ts';
import { LIST_ENTRIES } from './list.data.ts';
import { MATH_ENTRIES } from './math.data.ts';
import { NUMBER_ENTRIES } from './number.data.ts';
import { OBJECT_ENTRIES } from './object.data.ts';
import { PROMISE_ENTRIES } from './promise.data.ts';
import type { StdlibEntry } from './stdlib.types.ts';
import { TEXT_ENTRIES } from './text.data.ts';
import { TIME_ENTRIES } from './time.data.ts';

export const STDLIB: readonly StdlibEntry[] = [
  ...TEXT_ENTRIES, ...LIST_ENTRIES, ...OBJECT_ENTRIES, ...MATH_ENTRIES, ...NUMBER_ENTRIES,
  ...TIME_ENTRIES, ...PROMISE_ENTRIES, ...ERROR_ENTRIES, ...DATE_ENTRIES, ...IO_ENTRIES,
];
