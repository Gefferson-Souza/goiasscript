import { afterAll, describe, expect, it } from 'vitest';
import { allDistText, cleanupWorkspaces, fixture, extractTarball, getTarball, listTarball, readTarballJson, readText, runInstalled } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

describe('tarball do goiasscript', () => {
  it('o tarball traz só o que deve, com README e LICENSE', async () => {
    const { tarball } = await getTarball();
    const entries = await listTarball(tarball);
    expect(entries).toEqual(
      expect.arrayContaining(['package/README.md', 'package/LICENSE', 'package/package.json', 'package/dist/goiasscript.mjs', 'package/dist/goias.mjs', 'package/dist/cli.mjs', 'package/dist/index.mjs', 'package/dist/index.d.ts']),
    );
    expect(entries.filter((entry) => /\.(ts|map)$/u.test(entry) && !entry.endsWith('.d.ts'))).toEqual([]);
    expect(entries.some((entry) => entry.startsWith('package/src/'))).toBe(false);
    expect(entries.filter((entry) => !/^package\/(dist\/|README\.md$|LICENSE$|package\.json$)/u.test(entry))).toEqual([]);
    const manifest = await readTarballJson(tarball, 'package/package.json');
    expect(manifest['dependencies']).toBeUndefined();
    expect(JSON.stringify(manifest)).not.toContain('workspace:');
  });

  it('os binários têm shebang e o bundle não aponta para o workspace', async () => {
    const dist = await extractTarball(await getTarball());
    for (const bin of ['goiasscript.mjs', 'goias.mjs']) expect(readText(dist, `dist/${bin}`).startsWith('#!/usr/bin/env node\n')).toBe(true);
    expect(allDistText(dist)).not.toMatch(/@goiasscript\/|\.\.\/src\/|[./]node_modules\//u);
  });

  it('a partida não carrega o Terser, que só entra sob demanda', async () => {
    const run = await runInstalled(['dedo_de_prosa']);
    expect(run.exitCode).toBe(0);
    expect(run.loadedModules.some((url) => /terser|optimizer/u.test(url))).toBe(false);
  });

  it('o otimizador carrega ao pedir --otimiza', async () => {
    const directory = fixture({ 'oi.gs': 'prosa("oi")\n' });
    const run = await runInstalled(['traduz', 'oi.gs', '--otimiza', '-s', '-'], { cwd: directory });
    expect(run.exitCode).toBe(0);
    expect(run.loadedModules.some((url) => /terser|optimizer/u.test(url))).toBe(true);
  });
});
