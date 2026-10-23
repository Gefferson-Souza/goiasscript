import * as vscode from 'vscode';
import { EXTENSION_ID, LANGUAGE_ID, WAIT_INTERVAL_MS, WAIT_TIMEOUT_MS } from './integration.constants.ts';

export async function activateExtension(): Promise<vscode.Extension<unknown>> {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  if (extension === undefined) throw new Error(`a extensão ${EXTENSION_ID} não foi carregada pelo VS Code`);
  await extension.activate();
  return extension;
}

export async function openAndRun(command: string, file: string): Promise<vscode.TextDocument> {
  await activateExtension();
  const uri = vscode.Uri.file(file);
  const document = await vscode.workspace.openTextDocument(uri);
  if (document.languageId !== LANGUAGE_ID) throw new Error(`o arquivo abriu como "${document.languageId}", não como ${LANGUAGE_ID}`);
  await vscode.window.showTextDocument(document);
  await vscode.commands.executeCommand(command, uri);
  return document;
}

export async function waitFor<T>(read: () => T | undefined, description: string): Promise<T> {
  const deadline = Date.now() + WAIT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const value = read();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, WAIT_INTERVAL_MS));
  }
  throw new Error(`tempo esgotado esperando: ${description}`);
}

export function captureErrorMessages(): { readonly messages: string[]; readonly restore: () => void } {
  const messages: string[] = [];
  const original = vscode.window.showErrorMessage;
  const replacement = (message: string): Thenable<undefined> => {
    messages.push(message);
    return Promise.resolve(undefined);
  };
  (vscode.window as { showErrorMessage: unknown }).showErrorMessage = replacement;
  return {
    messages,
    restore: () => {
      (vscode.window as { showErrorMessage: unknown }).showErrorMessage = original;
    },
  };
}

export async function closeEverything(): Promise<void> {
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  vscode.window.terminals.forEach((terminal) => {
    terminal.dispose();
  });
}
