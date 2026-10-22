import { describe, expect, it } from 'vitest';
import { encodeVlq } from '../../../src/sourcemap/vlq.ts';

describe('VLQ', () => {
  it.each([[0, 'A'], [1, 'C'], [-1, 'D'], [15, 'e'], [16, 'gB'], [-16, 'hB'], [123, '2H']])('%i → %s', (value, text) => {
    expect(encodeVlq(value)).toBe(text);
  });
});
