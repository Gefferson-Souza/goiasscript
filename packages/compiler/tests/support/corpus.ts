import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../conformance/', import.meta.url));

export function readCorpus(): readonly string[] {
  return readdirSync(ROOT).map((id) => readFileSync(join(ROOT, id, 'input.gs'), 'utf8'));
}
