import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { REPOSITORY_ROOT } from './support/manifest.ts';

describe('.gitattributes', () => {
  it('marca os arquivos .gs como JavaScript para o GitHub', () => {
    const attributes = fs.readFileSync(path.join(REPOSITORY_ROOT, '.gitattributes'), 'utf8');
    expect(attributes.split(/\r?\n/u)).toContain('*.gs linguist-language=JavaScript');
  });
});
