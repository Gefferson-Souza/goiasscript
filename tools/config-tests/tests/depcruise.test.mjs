import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { cruise } from 'dependency-cruiser';
import { afterEach, describe, expect, it } from 'vitest';

const config = createRequire(import.meta.url)('../../../.dependency-cruiser.cjs');
const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
let temporary = [];
afterEach(() => { for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true }); temporary = []; });

async function violatedRules(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'depcruise-'));
  temporary = [...temporary, root];
  fs.symlinkSync(path.join(ROOT_DIR, 'node_modules'), path.join(root, 'node_modules'), 'junction');
  for (const [rel, text] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  const result = await cruise(['packages'], { baseDir: root, validate: true, ruleSet: { forbidden: config.forbidden }, tsPreCompilationDeps: true }, { exportsFields: ['exports'], conditionNames: ['import', 'node', 'default'] });
  return result.output.summary.violations.map((violation) => violation.rule.name);
}

describe('dependency-cruiser', () => {
  it('language não importa compiler', async () => { expect(await violatedRules({ 'packages/language/src/a.ts': "import '../../compiler/src/b.ts';\n", 'packages/compiler/src/b.ts': 'export const b = 1;\n' })).toContain('language-nao-importa-camada-acima'); });
  it('language e compiler não importam node:*', async () => { expect(await violatedRules({ 'packages/compiler/src/a.ts': "import { readFileSync } from 'node:fs';\nexport const read = readFileSync;\n" })).toContain('isomorfico-sem-node'); });
  it('compiler não tem dependência de runtime', async () => { expect(await violatedRules({ 'packages/compiler/src/a.ts': "import { expect } from 'vitest';\nexport const e = expect;\n" })).toContain('sem-dependencia-de-runtime-no-compiler'); });
  it('proíbe ciclos', async () => { expect(await violatedRules({ 'packages/language/src/a.ts': "import './b.ts';\n", 'packages/language/src/b.ts': "import './a.ts';\n" })).toContain('sem-ciclos'); });
  it('aceita a camada certa', async () => { expect(await violatedRules({ 'packages/compiler/src/a.ts': "import '../../language/src/b.ts';\n", 'packages/language/src/b.ts': 'export const b = 1;\n' })).toEqual([]); });
});
