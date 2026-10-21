import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createLexicon } from '../src/lexicon.mjs';
import { hasDictionaries } from './support/dictionaries.mjs';

const MIN_RECALL = 0.9;
const MIN_NAMES = 100;
const readNames = (file) => fs.readFileSync(new URL(`../fixtures/${file}`, import.meta.url), 'utf8').split(/\s+/).filter(Boolean);
const lexicon = createLexicon();
const isFlagged = (name) => ['strong', 'weak'].includes(lexicon.analyzeName(name).tier);

describe.skipIf(!hasDictionaries)('selftest do gate de idioma (R14)', () => {
  const portuguese = readNames('pt-names.txt');
  const english = readNames('en-names.txt');
  it('o corpus em português tem 100 nomes ou mais, com existente e buscarUsuario', () => {
    expect(portuguese.length).toBeGreaterThanOrEqual(MIN_NAMES);
    expect(portuguese).toEqual(expect.arrayContaining(['existente', 'buscarUsuario']));
  });
  it('marca pelo menos 90% dos nomes em português', () => {
    const missed = portuguese.filter((name) => !isFlagged(name));
    expect((portuguese.length - missed.length) / portuguese.length, `não marcados: ${missed.join(' ')}`).toBeGreaterThanOrEqual(MIN_RECALL);
  });
  it('marca existente e buscarUsuario', () => { expect(['existente', 'buscarUsuario'].filter((name) => !isFlagged(name))).toEqual([]); });
  it('não marca nenhum nome em inglês', () => { expect(english.filter(isFlagged)).toEqual([]); });
});
