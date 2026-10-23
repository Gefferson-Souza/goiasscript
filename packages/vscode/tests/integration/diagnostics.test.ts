import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { suite, suiteTeardown, test } from 'mocha';
import * as vscode from 'vscode';
import { makeTempDir, removeTempDirs } from './fixtures.ts';
import { BROKEN_PROGRAM, BROKEN_PROGRAM_CODE, DIAGNOSTICS_SOURCE, TEST_TIMEOUT_MS } from './integration.constants.ts';
import { activateExtension, closeEverything, waitFor } from './vscode-helpers.ts';

function codeValue(code: vscode.Diagnostic['code']): string {
  return typeof code === 'object' ? String(code.value) : String(code ?? '');
}

suite('diagnósticos', function () {
  this.timeout(TEST_TIMEOUT_MS);
  suiteTeardown(async () => {
    await closeEverything();
    removeTempDirs();
  });

  test('abrir um .gs com erro publica o diagnóstico da extensão', async () => {
    await activateExtension();
    const file = path.join(makeTempDir(), 'erro.gs');
    fs.writeFileSync(file, BROKEN_PROGRAM);
    const uri = vscode.Uri.file(file);
    await vscode.window.showTextDocument(await vscode.workspace.openTextDocument(uri));
    const diagnostics = await waitFor(() => {
      const found = vscode.languages.getDiagnostics(uri);
      return found.length > 0 ? found : undefined;
    }, 'diagnóstico do arquivo com erro');
    assert.ok(diagnostics.every((diagnostic) => diagnostic.source === DIAGNOSTICS_SOURCE));
    assert.ok(diagnostics.some((diagnostic) => codeValue(diagnostic.code) === BROKEN_PROGRAM_CODE));
    assert.ok(diagnostics.some((diagnostic) => diagnostic.severity === vscode.DiagnosticSeverity.Error));
  });
});
