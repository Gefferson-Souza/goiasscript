import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const DICTIONARY_DIR = '/usr/share/dict';
export const DICTIONARY_FILES = ['brazilian', 'american-english', 'british-english'];

export function hashDictionaries(dir = DICTIONARY_DIR) {
  const hashes = {};
  for (const name of DICTIONARY_FILES) {
    const file = path.join(dir, name);
    if (!fs.existsSync(file)) throw new Error(`dicionário indisponível: ${file} (instale wbrazilian, wamerican e wbritish)`);
    hashes[name] = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  }
  return hashes;
}

export function verifyDictionaryLock(lockPath, dir = DICTIONARY_DIR) {
  const locked = JSON.parse(fs.readFileSync(lockPath, 'utf8')).files;
  const actual = hashDictionaries(dir);
  const diverged = DICTIONARY_FILES.filter((name) => locked[name] !== actual[name]);
  if (diverged.length > 0) throw new Error(`hash de dicionário divergente (${diverged.join(', ')}); atualizar é decisão explícita: rode "lock-dictionaries". Atual: ${JSON.stringify(actual)}`);
}

export function writeDictionaryLock(lockPath, dir = DICTIONARY_DIR) {
  fs.writeFileSync(lockPath, `${JSON.stringify({ files: hashDictionaries(dir) }, null, 2)}\n`);
}
