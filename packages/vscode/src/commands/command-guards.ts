import type { Tone } from '@goiasscript/compiler';
import type { ExtensionHost, HostDocument } from '../host/extension-host.types.ts';
import { FILE_SCHEME, LANGUAGE_ID, SOURCE_EXTENSION } from '../host/host.constants.ts';
import { messagesFor } from './commands.messages.ts';
import type { CliCommand, GuardRefusal, GuardResult } from './commands.types.ts';

const EXECUTING_COMMAND: CliCommand = 'bota_pra_moer';
// Caminho de rede no Windows faria o comando abrir SMB e entregar o hash NTLM do usuário.
const NETWORK_PATH = /^[\\/]{2}/u;

// A pasta controla files.associations, então a linguagem sozinha não prova que o arquivo é .gs.
const hasSourceExtension = (fsPath: string): boolean => fsPath.toLowerCase().endsWith(SOURCE_EXTENSION);

export function guardCommand(command: CliCommand, document: HostDocument | undefined, trusted: boolean): GuardResult {
  if (document === undefined) return { allowed: false, reason: 'not-goiasscript' };
  if (document.scheme !== FILE_SCHEME || NETWORK_PATH.test(document.fsPath)) return { allowed: false, reason: 'not-file' };
  if (document.languageId !== LANGUAGE_ID || !hasSourceExtension(document.fsPath)) return { allowed: false, reason: 'not-goiasscript' };
  if (command === EXECUTING_COMMAND && !trusted) return { allowed: false, reason: 'untrusted' };
  return { allowed: true };
}

export function guardRefusalMessage(reason: GuardRefusal, tone: Tone): string {
  return messagesFor(tone).refusal[reason];
}

export async function requireAllowedDocument(host: ExtensionHost, command: CliCommand, resourceUri: string | undefined): Promise<HostDocument | null> {
  const document = await host.resolveDocument(resourceUri);
  const verdict = guardCommand(command, document, host.isWorkspaceTrusted());
  if (verdict.allowed && document !== undefined) return document;
  host.showError(guardRefusalMessage(verdict.allowed ? 'not-goiasscript' : verdict.reason, host.settings().tone));
  return null;
}
