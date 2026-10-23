import assert from 'node:assert';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { suite, suiteTeardown, test } from 'mocha';
import * as vscode from 'vscode';
import { isCliCall, makeTempDir, spyOnChildProcess, removeTempDirs } from './fixtures.ts';
import { RUN_COMMAND, SAMPLE_PROGRAM, SCENARIO_ENV, TEST_TIMEOUT_MS, TRANSLATE_COMMAND, UNTRUSTED_MESSAGE } from './integration.constants.ts';
import type { ChildCall, ChildProcessModule } from './integration.types.ts';
import { activateExtension, captureErrorMessages, closeEverything, openAndRun } from './vscode-helpers.ts';

const expectUntrusted = process.env[SCENARIO_ENV] === 'untrusted';

interface Outcome {
  readonly calls: readonly ChildCall[];
  readonly errors: readonly string[];
  readonly dir: string;
}

async function runCommand(command: string): Promise<Outcome> {
  const dir = makeTempDir();
  const file = path.join(dir, 'programa.gs');
  fs.writeFileSync(file, SAMPLE_PROGRAM);
  const calls: ChildCall[] = [];
  const spy = spyOnChildProcess(childProcess as unknown as ChildProcessModule, calls, isCliCall);
  const errors = captureErrorMessages();
  try {
    await openAndRun(command, file);
    await spy.settled();
  } finally {
    spy.restore();
    errors.restore();
  }
  return { calls, errors: errors.messages, dir };
}

suite(`modo restrito (${expectUntrusted ? 'pasta não confiável' : 'pasta confiável'})`, function () {
  this.timeout(TEST_TIMEOUT_MS);
  suiteTeardown(async () => {
    await closeEverything();
    removeTempDirs();
  });

  test('o manifesto exige o suporte limitado em pasta não confiável', async () => {
    const extension = await activateExtension();
    const capabilities = (extension.packageJSON as { capabilities?: { untrustedWorkspaces?: { supported?: unknown } } }).capabilities;
    assert.strictEqual(capabilities?.untrustedWorkspaces?.supported, 'limited');
  });

  test('o perfil de teste abriu a pasta com a confiança esperada', () => {
    assert.strictEqual(vscode.workspace.isTrusted, !expectUntrusted);
  });

  test('traduz funciona nos dois modos', async () => {
    const outcome = await runCommand(TRANSLATE_COMMAND);
    assert.deepStrictEqual(outcome.calls.map((call) => call.api), ['execFile']);
    assert.deepStrictEqual(outcome.errors, []);
    assert.ok(fs.existsSync(path.join(outcome.dir, 'programa.js')), 'a tradução devia ter gerado o arquivo de saída');
  });

  test(expectUntrusted ? 'bota_pra_moer é recusado sem executar nada' : 'bota_pra_moer executa o programa', async () => {
    const outcome = await runCommand(RUN_COMMAND);
    if (expectUntrusted) {
      assert.deepStrictEqual(outcome.calls, []);
      assert.strictEqual(outcome.errors.length, 1);
      assert.ok(outcome.errors[0]?.includes(UNTRUSTED_MESSAGE), `mensagem inesperada: ${outcome.errors[0] ?? ''}`);
    } else {
      assert.deepStrictEqual(outcome.calls.map((call) => call.api), ['spawn']);
      assert.deepStrictEqual(outcome.errors, []);
    }
  });
});
