import assert from 'node:assert';
import childProcess from 'node:child_process';
import { suite, suiteTeardown, test } from 'mocha';
import * as vscode from 'vscode';
import { isCliCall, spyOnChildProcess } from './fixtures.ts';
import { LANGUAGE_ID, NOT_FILE_MESSAGE, RUN_COMMAND, SAMPLE_PROGRAM, TEST_TIMEOUT_MS, TRANSLATE_COMMAND, VIRTUAL_SCHEME } from './integration.constants.ts';
import type { ChildCall, ChildProcessModule } from './integration.types.ts';
import { activateExtension, captureErrorMessages, closeEverything } from './vscode-helpers.ts';

const COMMANDS = [TRANSLATE_COMMAND, RUN_COMMAND] as const;
const VIRTUAL_URI = vscode.Uri.parse(`${VIRTUAL_SCHEME}:/virtual.gs`);

async function expectRefusal(command: string, open: () => Thenable<vscode.TextDocument>, target?: vscode.Uri): Promise<void> {
  await activateExtension();
  const document = await open();
  assert.strictEqual(document.languageId, LANGUAGE_ID);
  await vscode.window.showTextDocument(document);
  const calls: ChildCall[] = [];
  const spy = spyOnChildProcess(childProcess as unknown as ChildProcessModule, calls, isCliCall);
  const errors = captureErrorMessages();
  try {
    await vscode.commands.executeCommand(command, ...(target === undefined ? [] : [target]));
    await spy.settled();
  } finally {
    spy.restore();
    errors.restore();
  }
  assert.deepStrictEqual(calls, []);
  assert.strictEqual(errors.messages.length, 1);
  assert.ok(errors.messages[0]?.includes(NOT_FILE_MESSAGE), `mensagem inesperada: ${errors.messages[0] ?? ''}`);
}

suite('esquema do documento', function () {
  this.timeout(TEST_TIMEOUT_MS);
  const provider = vscode.workspace.registerTextDocumentContentProvider(VIRTUAL_SCHEME, { provideTextDocumentContent: () => SAMPLE_PROGRAM });
  suiteTeardown(async () => {
    provider.dispose();
    await closeEverything();
  });

  for (const command of COMMANDS) {
    test(`${command} recusa documento untitled`, async () => {
      await expectRefusal(command, () => vscode.workspace.openTextDocument({ language: LANGUAGE_ID, content: SAMPLE_PROGRAM }));
    });
    test(`${command} recusa documento de provedor virtual`, async () => {
      await expectRefusal(command, () => vscode.workspace.openTextDocument(VIRTUAL_URI), VIRTUAL_URI);
    });
  }
});
