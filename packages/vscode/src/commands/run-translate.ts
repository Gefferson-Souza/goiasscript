import type { HostDocument } from '../host/extension-host.types.ts';
import { buildCliInvocation } from './cli-invocation.ts';
import { runCliToCompletion } from './cli-process.ts';
import { requireAllowedDocument } from './command-guards.ts';
import { CLI_ENTRY_RELATIVE_PATH, OVERWRITE_EXIT_CODE, OVERWRITE_LABEL, OVERWRITE_REFUSED_CODE } from './commands.constants.ts';
import { messagesFor } from './commands.messages.ts';
import type { CliOutcome, CommandDeps } from './commands.types.ts';
import { sanitizeTerminalText } from './sanitize-terminal-text.ts';

type ExitedOutcome = Extract<CliOutcome, { kind: 'exited' }>;

function translate(deps: CommandDeps, document: HostDocument, overwrite: boolean): Promise<CliOutcome> {
  const { host, execFile, runtimePath } = deps;
  const invocation = buildCliInvocation({ command: 'traduz', documentPath: document.fsPath, cliEntry: host.resolvePath(CLI_ENTRY_RELATIVE_PATH), runtimePath, tone: host.settings().tone, overwrite });
  return runCliToCompletion(execFile, invocation);
}

const refusesToOverwrite = (outcome: ExitedOutcome): boolean => outcome.exitCode === OVERWRITE_EXIT_CODE && outcome.stderr.includes(OVERWRITE_REFUSED_CODE);

function report(deps: CommandDeps, outcome: CliOutcome): void {
  const { host } = deps;
  const messages = messagesFor(host.settings().tone);
  if (outcome.kind === 'not-started') {
    host.showError(messages.spawnFailed);
    return;
  }
  host.appendOutput(outcome.stderr);
  if (outcome.exitCode === 0) host.showInformation(sanitizeTerminalText(outcome.stdout).trim());
  else host.showError(messages.translateFailed);
}

async function translateConfirmingOverwrite(deps: CommandDeps, document: HostDocument): Promise<void> {
  const first = await translate(deps, document, false);
  if (first.kind !== 'exited' || !refusesToOverwrite(first)) {
    report(deps, first);
    return;
  }
  deps.host.appendOutput(first.stderr);
  const confirmed = await deps.host.askConfirmation(messagesFor(deps.host.settings().tone).askOverwrite, OVERWRITE_LABEL);
  if (confirmed) report(deps, await translate(deps, document, true));
}

export function runTranslate(deps: CommandDeps): (resourceUri?: string) => Promise<void> {
  return async (resourceUri) => {
    const document = await requireAllowedDocument(deps.host, 'traduz', resourceUri);
    if (document !== null) await translateConfirmingOverwrite(deps, document);
  };
}
