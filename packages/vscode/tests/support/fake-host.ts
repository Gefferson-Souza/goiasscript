import type { Disposable, DocumentEvent, HostDocument } from '../../src/host/extension-host.types.ts';
import { FILE_SCHEME, LANGUAGE_ID } from '../../src/host/host.constants.ts';
import { DEFAULT_DIAGNOSTICS_DELAY_MS, DEFAULT_TONE } from '../../src/settings/settings.constants.ts';
import type { FakeHost, FakeHostOptions, FakeTerminal } from './fake-host.types.ts';

const DEFAULT_DOCUMENT: HostDocument = { uri: 'file:///work/programa.gs', scheme: FILE_SCHEME, fsPath: '/work/programa.gs', languageId: LANGUAGE_ID, version: 1, text: '' };

function subscribe<T>(handlers: T[], handler: T): Disposable {
  handlers.push(handler);
  return {
    dispose: () => {
      handlers.splice(handlers.indexOf(handler), 1);
    },
  };
}

function createTerminal(title: string): FakeTerminal {
  const inputHandlers: ((text: string) => void)[] = [];
  const terminal: FakeTerminal = {
    title,
    written: [],
    exitCodes: [],
    write: (text) => {
      terminal.written.push(text);
    },
    onInput: (handler) => {
      inputHandlers.push(handler);
    },
    close: (exitCode) => {
      terminal.exitCodes.push(exitCode);
    },
    type: (text) => { inputHandlers.forEach((handler) => {
      handler(text);
    }); },
  };
  return terminal;
}

export function createFakeHost(options: FakeHostOptions = {}): FakeHost {
  const state = { trusted: options.trusted ?? true };
  const documentHandlers: ((event: DocumentEvent) => void)[] = [];
  const trustHandlers: (() => void)[] = [];
  const host: FakeHost = {
    diagnostics: new Map(),
    errors: [],
    output: [],
    terminals: [],
    commands: new Map(),
    completionProviders: [],
    hoverProviders: [],
    settings: () => ({ tone: DEFAULT_TONE, diagnosticsDelayMs: DEFAULT_DIAGNOSTICS_DELAY_MS, lessonBaseUrl: null, ...options.settings }),
    isWorkspaceTrusted: () => state.trusted,
    activeDocument: () => options.activeDocument,
    onDocumentEvent: (handler) => subscribe(documentHandlers, handler),
    onTrustGranted: (handler) => subscribe(trustHandlers, handler),
    setDiagnostics: (documentUri, diagnostics) => host.diagnostics.set(documentUri, diagnostics),
    clearDiagnostics: (documentUri) => host.diagnostics.delete(documentUri),
    showError: (message) => host.errors.push(message),
    askConfirmation: () => Promise.resolve(options.confirmation ?? false),
    appendOutput: (text) => host.output.push(text),
    openProgramTerminal: (title) => {
      const terminal = createTerminal(title);
      host.terminals.push(terminal);
      return terminal;
    },
    resolvePath: (relative) => `/extension/${relative}`,
    registerCompletionProvider: (provider) => subscribe(host.completionProviders, provider),
    registerHoverProvider: (provider) => subscribe(host.hoverProviders, provider),
    registerCommand: (commandId, handler) => {
      host.commands.set(commandId, handler);
      return { dispose: () => host.commands.delete(commandId) };
    },
    emit: (event) => { documentHandlers.forEach((handler) => {
      handler(event);
    }); },
    grantTrust: () => {
      state.trusted = true;
      trustHandlers.forEach((handler) => {
        handler();
      });
    },
    makeDocument: (overrides) => ({ ...DEFAULT_DOCUMENT, ...overrides }),
  };
  return host;
}
