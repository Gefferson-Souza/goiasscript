import type { CommandHandler, CompletionProviderPort, DocumentEvent, ExtensionHost, HostDiagnostic, HostDocument, HoverProviderPort, ProgramTerminal } from '../../src/host/extension-host.types.ts';
import type { ExtensionSettings } from '../../src/settings/settings.types.ts';

export interface FakeHostOptions {
  readonly settings?: Partial<ExtensionSettings>;
  readonly trusted?: boolean;
  readonly confirmation?: boolean;
  readonly activeDocument?: HostDocument;
}

export interface FakeTerminal extends ProgramTerminal {
  readonly title: string;
  readonly written: string[];
  readonly exitCodes: number[];
  type(text: string): void;
}

export interface FakeHost extends ExtensionHost {
  readonly diagnostics: Map<string, readonly HostDiagnostic[]>;
  readonly errors: string[];
  readonly output: string[];
  readonly terminals: FakeTerminal[];
  readonly commands: Map<string, CommandHandler>;
  readonly completionProviders: CompletionProviderPort[];
  readonly hoverProviders: HoverProviderPort[];
  emit(event: DocumentEvent): void;
  grantTrust(): void;
  makeDocument(overrides: Partial<HostDocument>): HostDocument;
}
