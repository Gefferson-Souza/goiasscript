import { compile as compileProgram, type Tone } from '@goiasscript/compiler';
import { lookupDiagnostic } from '@goiasscript/language';
import type { Disposable, DocumentEvent, HostDiagnostic, HostDocument } from '../host/extension-host.types.ts';
import { FILE_SCHEME, LANGUAGE_ID, UNTITLED_SCHEME } from '../host/host.constants.ts';
import {
  FALLBACK_FILE_NAME,
  INTERNAL_ERROR_CODE,
  INTERNAL_ERROR_FALLBACK_MESSAGE,
  MAX_DIAGNOSTICS_PER_DOCUMENT,
  MAX_DOCUMENT_LENGTH,
  OVERFLOW_DIAGNOSTIC_CODE,
  OVERSIZE_DIAGNOSTIC_CODE,
  PATH_SEPARATOR,
  UNKNOWN_ERROR_NAME,
} from './diagnostics.constants.ts';
import type { LiveDiagnosticsOptions, PendingDocument } from './live-diagnostics.types.ts';
import { toHostDiagnostic } from './to-host-diagnostic.ts';

const COMPILED_SCHEMES: ReadonlySet<string> = new Set([FILE_SCHEME, UNTITLED_SCHEME]);

const baseName = (fsPath: string): string => fsPath.split(PATH_SEPARATOR).at(-1) || FALLBACK_FILE_NAME;

function internalFailure(tone: Tone): readonly HostDiagnostic[] {
  const message = lookupDiagnostic(INTERNAL_ERROR_CODE)?.messages[tone] ?? INTERNAL_ERROR_FALLBACK_MESSAGE;
  return [{ code: INTERNAL_ERROR_CODE, severity: 'error', message, startLine: 0, startCharacter: 0, endLine: 0, endCharacter: 0 }];
}

function oversizeNotice(): readonly HostDiagnostic[] {
  const message = `Esse arquivo é grande demais, sô: passa de ${String(MAX_DOCUMENT_LENGTH)} caracteres. Não vou conferir ele enquanto você digita.`;
  return [{ code: OVERSIZE_DIAGNOSTIC_CODE, severity: 'warning', message, startLine: 0, startCharacter: 0, endLine: 0, endCharacter: 0 }];
}

function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return UNKNOWN_ERROR_NAME;
}

function capDiagnostics(all: readonly HostDiagnostic[]): readonly HostDiagnostic[] {
  const omitted = all.slice(MAX_DIAGNOSTICS_PER_DOCUMENT);
  const first = omitted[0];
  if (first === undefined) return all;
  const notice: HostDiagnostic = {
    ...first,
    code: OVERFLOW_DIAGNOSTIC_CODE,
    severity: 'info',
    message: `E mais ${String(omitted.length)} problemas que eu não mostrei aqui, sô. Arruma os primeiros e eu mostro o resto.`,
  };
  return [...all.slice(0, MAX_DIAGNOSTICS_PER_DOCUMENT), notice];
}

async function diagnose(options: LiveDiagnosticsOptions, document: HostDocument): Promise<readonly HostDiagnostic[]> {
  const settings = options.host.settings();
  const compile = options.compile ?? compileProgram;
  if (document.text.length > MAX_DOCUMENT_LENGTH) return oversizeNotice();
  try {
    const result = await compile(document.text, { fileName: baseName(document.fsPath), tone: settings.tone, target: 'module', sourceMap: false });
    return capDiagnostics(result.diagnostics.map((diagnostic) => toHostDiagnostic(diagnostic, settings.lessonBaseUrl)));
  } catch (error) {
    options.host.appendOutput(`Erro interno ao conferir ${baseName(document.fsPath)}: ${describeError(error)}\n`);
    return internalFailure(settings.tone);
  }
}

// O mapa é trocado por um novo a cada evento: a versão vigente de cada documento decide se um resultado ainda vale.
export function createLiveDiagnostics(options: LiveDiagnosticsOptions): Disposable {
  const { host, timers } = options;
  let pending: ReadonlyMap<string, PendingDocument> = new Map();
  const remember = (uri: string, entry: PendingDocument): void => {
    pending = new Map([...pending, [uri, entry]]);
  };
  const cancelTimer = (uri: string): void => {
    const entry = pending.get(uri);
    if (entry?.timer !== undefined) timers.clear(entry.timer);
  };
  const run = async (document: HostDocument): Promise<void> => {
    remember(document.uri, { version: document.version, timer: undefined });
    const diagnostics = await diagnose(options, document);
    if (pending.get(document.uri)?.version === document.version) host.setDiagnostics(document.uri, diagnostics);
  };
  const handle = ({ kind, document }: DocumentEvent): void => {
    if (document.languageId !== LANGUAGE_ID || !COMPILED_SCHEMES.has(document.scheme)) return;
    cancelTimer(document.uri);
    if (kind === 'closed') {
      pending = new Map([...pending].filter(([uri]) => uri !== document.uri));
      host.clearDiagnostics(document.uri);
      return;
    }
    const timer = timers.set(() => {
      void run(document);
    }, host.settings().diagnosticsDelayMs);
    remember(document.uri, { version: document.version, timer });
  };
  const subscription = host.onDocumentEvent(handle);
  return {
    dispose: () => {
      subscription.dispose();
      pending.forEach((entry) => {
        if (entry.timer !== undefined) timers.clear(entry.timer);
      });
      pending = new Map();
    },
  };
}
