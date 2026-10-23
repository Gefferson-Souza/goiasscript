import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { PACKAGE_ROOT, REPOSITORY_ROOT } from './support/manifest.ts';

const GENERATED_DIR = path.join(REPOSITORY_ROOT, 'packages/language/generated');
const INSTRUCTION = 'rode `corepack pnpm build:vscode`';

const PAIRS = [
  ['syntaxes/goiasscript.tmLanguage.json', 'goiasscript.tmLanguage.json'],
  ['snippets/goiasscript.json', 'snippets.json'],
] as const;

describe('cópias geradas do pacote', () => {
  it.each(PAIRS)('%s é idêntico byte a byte ao gerado', (packaged, generated) => {
    const packagedFile = path.join(PACKAGE_ROOT, packaged);
    expect(fs.existsSync(packagedFile), `${packaged} não existe: ${INSTRUCTION}`).toBe(true);
    const same = fs.readFileSync(packagedFile).equals(fs.readFileSync(path.join(GENERATED_DIR, generated)));
    expect(same, `${packaged} divergiu do gerado: ${INSTRUCTION}`).toBe(true);
  });
});
