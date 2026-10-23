import type { CompletionLabel } from '@goiasscript/language';
import type { ExtensionSettings } from '../settings/settings.types.ts';

export interface HostDocument {
  readonly uri: string;
  readonly scheme: string;
  readonly fsPath: string;
  readonly languageId: string;
  readonly version: number;
  readonly text: string;
}

export interface HostDiagnostic {
  readonly code: string;
  readonly severity: 'error' | 'warning';
  readonly message: string;
  readonly startLine: number;
  readonly startCharacter: number;
  readonly endLine: number;
  readonly endCharacter: number;
  readonly lessonUrl?: string;
}

export interface Disposable {
  dispose(): void;
}

export interface ProgramTerminal {
  write(text: string): void;
  onInput(handler: (text: string) => void): void;
  close(exitCode: number): void;
}

export type CompletionItemData = Pick<CompletionLabel, 'label' | 'detail' | 'kind'> & { readonly insertText?: string };

export interface HoverContent {
  readonly markdown: string;
  readonly startCharacter: number;
  readonly endCharacter: number;
}

export interface CompletionProviderPort {
  provide(context: { readonly linePrefix: string }): readonly CompletionItemData[];
}

export interface HoverProviderPort {
  provide(context: { readonly line: string; readonly character: number }): HoverContent | null;
}

export interface DocumentEvent {
  readonly kind: 'opened' | 'changed' | 'closed';
  readonly document: HostDocument;
}

export interface ExtensionHost {
  readonly settings: () => ExtensionSettings;
  readonly isWorkspaceTrusted: () => boolean;
  readonly activeDocument: () => HostDocument | undefined;
  readonly onDocumentEvent: (handler: (event: DocumentEvent) => void) => Disposable;
  readonly onTrustGranted: (handler: () => void) => Disposable;
  readonly setDiagnostics: (documentUri: string, diagnostics: readonly HostDiagnostic[]) => void;
  readonly clearDiagnostics: (documentUri: string) => void;
  readonly showError: (message: string) => void;
  readonly askConfirmation: (message: string, confirmLabel: string) => Promise<boolean>;
  readonly appendOutput: (text: string) => void;
  readonly openProgramTerminal: (title: string) => ProgramTerminal;
  readonly resolvePath: (relative: string) => string;
  readonly registerCompletionProvider: (provider: CompletionProviderPort) => Disposable;
  readonly registerHoverProvider: (provider: HoverProviderPort) => Disposable;
  readonly registerCommand: (commandId: string, handler: () => Promise<void>) => Disposable;
}

export interface Feature {
  activate(host: ExtensionHost): Disposable;
}
