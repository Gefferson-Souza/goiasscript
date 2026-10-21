import fs from 'node:fs';
import path from 'node:path';
import { DICTIONARY_DIR } from '../../src/dictionary-lock.mjs';

export const hasDictionaries = fs.existsSync(path.join(DICTIONARY_DIR, 'brazilian'));
