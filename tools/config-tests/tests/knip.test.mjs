import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const ROOT_DIR = path.resolve(import.meta.dirname, '../../..');
let temporary = [];
afterEach(() => { for (const dir of temporary) fs.rmSync(dir, { recursive: true, force: true }); temporary = []; });

function runKnip(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'knip-'));
  temporary = [...temporary, root];
  fs.symlinkSync(path.join(ROOT_DIR, 'node_modules'), path.join(root, 'node_modules'), 'junction');
  fs.copyFileSync(path.join(ROOT_DIR, 'knip.json'), path.join(root, 'knip.json'));
  const base = { 'package.json': '{"name":"fixture","private":true,"type":"module"}', 'pnpm-workspace.yaml': 'packages:\n  - packages/*\n', 'packages/language/package.json': '{"name":"@fixture/language","private":true,"type":"module","exports":{".":"./src/index.ts"}}' };
  for (const [rel, text] of Object.entries({ ...base, ...files })) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  }
  return spawnSync('node', [path.join(ROOT_DIR, 'node_modules/knip/bin/knip.js'), '--no-progress'], { cwd: root, encoding: 'utf8' });
}

describe('knip', () => {
  it('barra arquivo morto e export sem uso', () => {
    const result = runKnip({ 'packages/language/src/index.ts': "import { used } from './helper.ts';\nexport const live = used;\n", 'packages/language/src/helper.ts': 'export const used = 1;\nexport const unusedExport = 2;\n', 'packages/language/src/dead.ts': 'export const dead = 1;\n' });
    expect(result.status).toBe(1);
    expect(result.stdout).toContain('packages/language/src/dead.ts');
    expect(result.stdout).toContain('unusedExport');
  });
  it('aprova projeto sem código morto', () => { expect(runKnip({ 'packages/language/src/index.ts': 'export const live = 1;\n' }).status).toBe(0); });
});
