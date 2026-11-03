import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { LANGUAGE_VERSION_LABEL } from '../lib/version-label.constants.ts';

const LAYOUT_SOURCE = fs.readFileSync(path.join(import.meta.dirname, '../app/layout.tsx'), 'utf8');
const HARDCODED_VERSION = /\bv\d+(\.\d+)*\b/u;

describe('rótulo de versão do playground', () => {
  it('mostra a versão da linguagem que o playground compila', () => {
    expect(LANGUAGE_VERSION_LABEL).toBe('v3');
  });
  it('o layout usa a constante em vez de versão escrita à mão', () => {
    expect(LAYOUT_SOURCE).toContain('LANGUAGE_VERSION_LABEL');
    expect(LAYOUT_SOURCE).not.toMatch(HARDCODED_VERSION);
  });
});
