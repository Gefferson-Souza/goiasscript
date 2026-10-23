export interface MenuEntry {
  readonly command: string;
  readonly when?: string;
}

export interface KeybindingEntry {
  readonly command: string;
  readonly when?: string;
}

export interface ExtensionManifest {
  readonly name: string;
  readonly version: string;
  readonly publisher: string;
  readonly main: string;
  readonly activationEvents: readonly string[];
  readonly engines: { readonly vscode: string };
  readonly capabilities: { readonly untrustedWorkspaces: { readonly supported: string; readonly description: string } };
  readonly contributes: {
    readonly menus: Readonly<Record<string, readonly MenuEntry[]>>;
    readonly keybindings: readonly KeybindingEntry[];
  };
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly devDependencies: Readonly<Record<string, string>>;
}
