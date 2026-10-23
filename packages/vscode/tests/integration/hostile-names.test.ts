import assert from 'node:assert';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { suite, suiteTeardown, test } from 'mocha';
import * as vscode from 'vscode';
import { isCliCall, isValidOnThisPlatform, makeTempDir, spyOnChildProcess, removeTempDirs } from './fixtures.ts';
import { END_OF_OPTIONS, HOSTILE_NAMES, PWNED_MARKER, RUN_COMMAND, SAMPLE_PROGRAM, TEST_TIMEOUT_MS, TRANSLATE_COMMAND } from './integration.constants.ts';
import type { ChildCall, ChildProcessModule } from './integration.types.ts';
import { closeEverything, openAndRun } from './vscode-helpers.ts';

suite('nomes hostis', function () {
  this.timeout(TEST_TIMEOUT_MS);
  suiteTeardown(async () => {
    await closeEverything();
    removeTempDirs();
  });

  for (const name of HOSTILE_NAMES.filter((candidate) => isValidOnThisPlatform(candidate))) {
    test(`${name} não vira comando`, async () => {
      const dir = makeTempDir();
      const file = path.join(dir, name);
      fs.writeFileSync(file, SAMPLE_PROGRAM);
      const calls: ChildCall[] = [];
      const spy = spyOnChildProcess(childProcess as unknown as ChildProcessModule, calls, isCliCall);
      try {
        await openAndRun(TRANSLATE_COMMAND, file);
        await openAndRun(RUN_COMMAND, file);
        await spy.settled();
      } finally {
        spy.restore();
      }
      const expectedPath = vscode.Uri.file(file).fsPath;
      assert.ok(calls.length >= 2, 'o comando precisa ter executado de verdade');
      assert.deepStrictEqual(new Set(calls.map((call) => call.api)), new Set(['execFile', 'spawn']));
      for (const call of calls) {
        assert.strictEqual(call.options['shell'], undefined);
        assert.strictEqual(call.args.filter((arg) => arg === expectedPath).length, 1);
        assert.strictEqual(call.args[call.args.indexOf(expectedPath) - 1], END_OF_OPTIONS);
      }
      assert.strictEqual(fs.existsSync(path.join(dir, PWNED_MARKER)), false);
      assert.strictEqual(fs.readFileSync(file, 'utf8'), SAMPLE_PROGRAM);
    });
  }
});
