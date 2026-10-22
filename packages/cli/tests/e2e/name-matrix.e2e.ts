import fs from 'node:fs';
import path from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { cleanupWorkspaces, fixture, runInstalled, sha256, snapshotTree } from './support/tarball.ts';

afterAll(cleanupWorkspaces);

const PROGRAM = 'prosa("oi")\n';
const STALE_TEMP = 'velho';

type NameCase =
  | { readonly name: string; readonly outcome: 'refused'; readonly code: string }
  | { readonly name: string; readonly outcome: 'works'; readonly skipOn?: readonly NodeJS.Platform[]; readonly afterDoubleDash?: boolean };

const CASES: readonly NameCase[] = [
  { name: 'x.txt', outcome: 'refused', code: 'GS0902' },
  { name: 'x', outcome: 'refused', code: 'GS0902' },
  { name: 'X.GS', outcome: 'works' },
  { name: 'x.gs', outcome: 'works' },
  { name: 'e.gs/f/programa.gs', outcome: 'works' },
  { name: 'nome com espaço.gs', outcome: 'works' },
  { name: 'a$(touch PWNED).gs', outcome: 'works' },
  { name: '`touch PWNED`.gs', outcome: 'works', skipOn: ['win32'] },
  { name: 'a";touch PWNED;".gs', outcome: 'works', skipOn: ['win32'] },
  { name: '-x.gs', outcome: 'works', afterDoubleDash: true },
  { name: 'café.gs', outcome: 'works' },
];

const applicable = CASES.filter((testCase) => testCase.outcome === 'refused' || !testCase.skipOn?.includes(process.platform));

describe.each(['traduz', 'bota_pra_moer'])('%s com nomes hostis', (command) => {
  it.each(applicable)('$name', async (testCase) => {
    const dir = fixture({ [testCase.name]: PROGRAM, 'x.temp.js': STALE_TEMP });
    const before = snapshotTree(dir);
    const afterDoubleDash = testCase.outcome === 'works' && testCase.afterDoubleDash === true;
    const run = await runInstalled([command, ...(afterDoubleDash ? ['--', testCase.name] : [testCase.name])], { cwd: dir });
    if (testCase.outcome === 'refused') {
      expect(run.exitCode).toBe(3);
      expect(run.stderr).toContain(testCase.code);
      expect(snapshotTree(dir)).toEqual(before);
      return;
    }
    expect(run.exitCode).toBe(0);
    expect(sha256(path.join(dir, testCase.name))).toBe(before.get(testCase.name));
    expect(fs.existsSync(path.join(dir, 'PWNED'))).toBe(false);
    expect(fs.readFileSync(path.join(dir, 'x.temp.js'), 'utf8')).toBe(STALE_TEMP);
  });
});

describe('recusas de saída', () => {
  it('saída igual à entrada e destino existente são recusados sem tocar no fonte', async () => {
    const dir = fixture({ 'x.gs': PROGRAM, 'x.mjs': 'existente' });
    fs.linkSync(path.join(dir, 'x.gs'), path.join(dir, 'h.gs'));
    const before = snapshotTree(dir);
    const attempts = [
      ['traduz', 'x.gs', '-s', 'x.gs', '--sobrescreve'],
      ['traduz', 'x.gs', '-s', 'h.gs', '--sobrescreve'],
      ['traduz', 'x.gs'],
    ];
    for (const args of attempts) {
      const run = await runInstalled(args, { cwd: dir });
      expect(run.exitCode).toBe(3);
      expect(run.stderr).toContain('GS0903');
      expect(snapshotTree(dir)).toEqual(before);
    }
  });

  it('X.GS e x.gs convivem em diretórios separados em sistema sem diferença de caixa', async () => {
    const upper = fixture({ 'X.GS': PROGRAM });
    const lower = fixture({ 'x.gs': PROGRAM });
    expect((await runInstalled(['traduz', 'X.GS'], { cwd: upper })).exitCode).toBe(0);
    expect((await runInstalled(['traduz', 'x.gs'], { cwd: lower })).exitCode).toBe(0);
  });
});
