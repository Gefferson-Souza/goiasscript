import * as vscode from 'vscode';
import { SETTINGS_SECTION } from '../settings/settings.constants.ts';
import { readSettings } from '../settings/settings.ts';
import { resourceUriOf } from './command-target.ts';
import { sanitizeTerminalText } from './terminal-text.ts';
import { DIAGNOSTICS_SOURCE, LANGUAGE_ID, OUTPUT_CHANNEL_NAME, TERMINAL_NEWLINE } from './host.constants.ts';
import type { CompletionItemData, Disposable, DocumentEvent, ExtensionHost, HostDiagnostic, HostDocument, ProgramTerminal } from './extension-host.types.ts';

const COMPLETION_KINDS: Readonly<Record<CompletionItemData['kind'], vscode.CompletionItemKind>> = {
  keyword: vscode.CompletionItemKind.Keyword,
  function: vscode.CompletionItemKind.Function,
  property: vscode.CompletionItemKind.Property,
};
const SEVERITIES: Readonly<Record<HostDiagnostic['severity'], vscode.DiagnosticSeverity>> = {
  error: vscode.DiagnosticSeverity.Error,
  warning: vscode.DiagnosticSeverity.Warning,
  info: vscode.DiagnosticSeverity.Information,
};
const NEWLINE_PATTERN = /\r?\n/gu;

function toHostDocument(document: vscode.TextDocument): HostDocument {
  return { uri: document.uri.toString(), scheme: document.uri.scheme, fsPath: document.uri.fsPath, languageId: document.languageId, version: document.version, text: document.getText() };
}

function toDiagnostic(diagnostic: HostDiagnostic): vscode.Diagnostic {
  const range = new vscode.Range(diagnostic.startLine, diagnostic.startCharacter, diagnostic.endLine, diagnostic.endCharacter);
  const result = new vscode.Diagnostic(range, diagnostic.message, SEVERITIES[diagnostic.severity]);
  const code = diagnostic.lessonUrl === undefined ? diagnostic.code : { value: diagnostic.code, target: vscode.Uri.parse(diagnostic.lessonUrl) };
  return Object.assign(result, { code, source: DIAGNOSTICS_SOURCE });
}

function toCompletionItem(data: CompletionItemData): vscode.CompletionItem {
  return Object.assign(new vscode.CompletionItem(data.label, COMPLETION_KINDS[data.kind]), { detail: data.detail, insertText: data.insertText ?? data.label });
}

// A hover mostra texto do programa do aluno: nunca confiável, nunca HTML.
function untrustedMarkdown(value: string): vscode.MarkdownString {
  return Object.assign(new vscode.MarkdownString(value), { isTrusted: false, supportHtml: false });
}

function createProgramTerminal(title: string): ProgramTerminal {
  const writeEmitter = new vscode.EventEmitter<string>();
  const closeEmitter = new vscode.EventEmitter<number>();
  const inputHandlers: ((text: string) => void)[] = [];
  const pending: string[] = [];
  const state = { opened: false };
  const pty: vscode.Pseudoterminal = {
    onDidWrite: writeEmitter.event,
    onDidClose: closeEmitter.event,
    open: () => {
      state.opened = true;
      pending.splice(0).forEach((text) => {
        writeEmitter.fire(text);
      });
    },
    close: () => undefined,
    handleInput: (data) => {
      inputHandlers.forEach((handler) => {
        handler(data);
      });
    },
  };
  vscode.window.createTerminal({ name: title, pty }).show();
  const write = (text: string): void => {
    const normalized = text.replace(NEWLINE_PATTERN, TERMINAL_NEWLINE);
    if (state.opened) writeEmitter.fire(normalized);
    else pending.push(normalized);
  };
  return {
    write,
    writeNotice: (text) => {
      write(sanitizeTerminalText(text));
    },
    onInput: (handler) => inputHandlers.push(handler),
    close: (exitCode) => {
      closeEmitter.fire(exitCode);
    },
  };
}

function onDocumentEvent(handler: (event: DocumentEvent) => void): Disposable {
  const emit = (kind: DocumentEvent['kind'], document: vscode.TextDocument): void => {
    if (document.languageId === LANGUAGE_ID) handler({ kind, document: toHostDocument(document) });
  };
  // Quem assina depois da abertura ainda recebe os documentos que já estavam abertos.
  vscode.workspace.textDocuments.forEach((document) => {
    emit('opened', document);
  });
  return vscode.Disposable.from(
    vscode.workspace.onDidOpenTextDocument((document) => {
      emit('opened', document);
    }),
    vscode.workspace.onDidChangeTextDocument((event) => {
      if (event.contentChanges.length > 0) emit('changed', event.document);
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      emit('closed', document);
    }),
  );
}

function createDiagnosticsApi(context: vscode.ExtensionContext): Pick<ExtensionHost, 'setDiagnostics' | 'clearDiagnostics' | 'showError' | 'askConfirmation' | 'appendOutput'> {
  const collection = vscode.languages.createDiagnosticCollection(LANGUAGE_ID);
  const output = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(collection, output);
  return {
    setDiagnostics: (documentUri, diagnostics) => {
      collection.set(vscode.Uri.parse(documentUri), diagnostics.map(toDiagnostic));
    },
    clearDiagnostics: (documentUri) => {
      collection.delete(vscode.Uri.parse(documentUri));
    },
    showError: (message) => {
      void vscode.window.showErrorMessage(message);
    },
    askConfirmation: async (message, confirmLabel) => (await vscode.window.showWarningMessage(message, { modal: true }, confirmLabel)) === confirmLabel,
    appendOutput: (text) => {
      output.append(sanitizeTerminalText(text));
    },
  };
}

function createLanguageApi(): Pick<ExtensionHost, 'registerCompletionProvider' | 'registerHoverProvider' | 'registerCommand'> {
  const selector: vscode.DocumentSelector = { language: LANGUAGE_ID };
  return {
    registerCompletionProvider: (provider) =>
      vscode.languages.registerCompletionItemProvider(selector, {
        provideCompletionItems: (document, position) =>
          provider.provide({ linePrefix: document.lineAt(position.line).text.slice(0, position.character) }).map(toCompletionItem),
      }),
    registerHoverProvider: (provider) =>
      vscode.languages.registerHoverProvider(selector, {
        provideHover: (document, position) => {
          const content = provider.provide({ line: document.lineAt(position.line).text, character: position.character });
          if (content === null) return undefined;
          const range = new vscode.Range(position.line, content.startCharacter, position.line, content.endCharacter);
          return new vscode.Hover(untrustedMarkdown(content.markdown), range);
        },
      }),
    registerCommand: (commandId, handler) => vscode.commands.registerCommand(commandId, (target?: unknown) => handler(resourceUriOf(target))),
  };
}

export function createVscodeHost(context: vscode.ExtensionContext): ExtensionHost {
  return {
    ...createDiagnosticsApi(context),
    ...createLanguageApi(),
    settings: () => {
      const configuration = vscode.workspace.getConfiguration(SETTINGS_SECTION);
      return readSettings({ tone: configuration.get('tone'), diagnosticsDelayMs: configuration.get('diagnosticsDelayMs'), lessonBaseUrl: configuration.get('lessonBaseUrl') });
    },
    isWorkspaceTrusted: () => vscode.workspace.isTrusted,
    activeDocument: () => {
      const document = vscode.window.activeTextEditor?.document;
      return document === undefined ? undefined : toHostDocument(document);
    },
    onDocumentEvent,
    onTrustGranted: (handler) => vscode.workspace.onDidGrantWorkspaceTrust(handler),
    openProgramTerminal: createProgramTerminal,
    resolvePath: (relative) => context.asAbsolutePath(relative),
  };
}
