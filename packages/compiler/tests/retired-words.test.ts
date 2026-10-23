import { RETIRED_WORDS } from '@goiasscript/language';
import { describe, expect, it } from 'vitest';
import { compile } from '../src/index.ts';

const RETIRED_CODE = 'GS0306';

const wordsWithoutRetiredDiagnostic = (): readonly string[] =>
  RETIRED_WORDS.map((entry) => entry.word).filter(
    (word) => !compile(`${word} valor é 1`).diagnostics.some((diagnostic) => diagnostic.code === RETIRED_CODE),
  );

describe('palavras aposentadas', () => {
  it('toda palavra aposentada no início da instrução dá GS0306', () => {
    expect(wordsWithoutRetiredDiagnostic()).toEqual([]);
  });
});
