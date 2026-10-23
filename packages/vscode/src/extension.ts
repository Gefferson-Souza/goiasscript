import type * as vscode from 'vscode';
import { commandsFeature } from './features/commands.feature.ts';
import { completionFeature } from './features/completion.feature.ts';
import { diagnosticsFeature } from './features/diagnostics.feature.ts';
import { hoverFeature } from './features/hover.feature.ts';
import { createVscodeHost } from './host/vscode-host.ts';

const FEATURES = [diagnosticsFeature, completionFeature, hoverFeature, commandsFeature] as const;

export function activate(context: vscode.ExtensionContext): void {
  const host = createVscodeHost(context);
  FEATURES.forEach((feature) => {
    context.subscriptions.push(feature.activate(host));
  });
}
