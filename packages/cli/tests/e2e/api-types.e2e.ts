import { execFile } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { promisify } from 'node:util';
import { afterAll, describe, expect, it } from 'vitest';
import { cleanupWorkspaces, getInstallDir } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

const execFileAsync = promisify(execFile);
const require = createRequire(import.meta.url);
const CONSUMER = [
  "import { compile, type CompileResult } from 'goiasscript';",
  "const result: CompileResult = compile('prosa(1)');",
  'process.stdout.write(JSON.stringify({ ok: result.ok }));',
  '',
].join('\n');
const RUNNER = "import { compile } from 'goiasscript';\nprocess.stdout.write(JSON.stringify({ ok: compile('prosa(1)').ok }));\n";

describe('API pública do pacote instalado', () => {
  it('compila um consumidor tipado em NodeNext estrito', async () => {
    const dir = await getInstallDir();
    fs.writeFileSync(path.join(dir, 'consumer.ts'), CONSUMER);
    const tsc = path.join(path.dirname(require.resolve('typescript/package.json')), 'bin', 'tsc');
    const flags = ['--noEmit', '--strict', '--module', 'nodenext', '--moduleResolution', 'nodenext', '--target', 'es2022', '--types', 'node', '--typeRoots', path.join(path.dirname(require.resolve('@types/node/package.json')), '..')];
    await expect(execFileAsync(process.execPath, [tsc, ...flags, 'consumer.ts'], { cwd: dir })).resolves.toBeDefined();
  });

  it('executa compile pelo Node e devolve ok: true', async () => {
    const dir = await getInstallDir();
    fs.writeFileSync(path.join(dir, 'runner.mjs'), RUNNER);
    const { stdout } = await execFileAsync(process.execPath, ['runner.mjs'], { cwd: dir });
    expect(JSON.parse(stdout)).toEqual({ ok: true });
  });
});
