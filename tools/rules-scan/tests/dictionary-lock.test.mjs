import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { DICTIONARY_FILES, hashDictionaries, verifyDictionaryLock, writeDictionaryLock } from '../src/dictionary-lock.mjs';

const SHA256_HEX = /^[0-9a-f]{64}$/;
let temporary = [];
afterEach(() => {
  for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true });
  temporary = [];
});

function createDirectory() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dictionary-lock-'));
  temporary = [...temporary, dir];
  return dir;
}

function createDictionaries(names) {
  const dir = createDirectory();
  for (const name of names) fs.writeFileSync(path.join(dir, name), `palavras de ${name}\n`);
  return dir;
}

describe('trava dos dicionários do gate de idioma', () => {
  it('aceita o lock gravado e barra o dicionário que mudou', () => {
    const dictionaries = createDictionaries(DICTIONARY_FILES);
    const lockPath = path.join(createDirectory(), 'dictionaries.lock.json');
    writeDictionaryLock(lockPath, dictionaries);
    expect(Object.keys(hashDictionaries(dictionaries))).toEqual(DICTIONARY_FILES);
    for (const hash of Object.values(hashDictionaries(dictionaries))) expect(hash).toMatch(SHA256_HEX);
    expect(() => verifyDictionaryLock(lockPath, dictionaries)).not.toThrow();
    fs.writeFileSync(path.join(dictionaries, 'brazilian'), 'outra versão do dicionário\n');
    expect(() => verifyDictionaryLock(lockPath, dictionaries)).toThrow(/divergente \(brazilian\)/);
  });
  it('barra a falta de um dicionário', () => {
    expect(() => hashDictionaries(createDictionaries(['brazilian']))).toThrow(/dicionário indisponível/);
  });
});
