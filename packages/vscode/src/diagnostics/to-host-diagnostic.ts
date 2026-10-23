import type { Diagnostic } from '@goiasscript/compiler';
import type { HostDiagnostic } from '../host/extension-host.types.ts';
import { TRAILING_SLASHES } from './diagnostics.constants.ts';

// O compilador conta linha e coluna a partir de 1, em unidades UTF-16 (as mesmas do editor).
export function toHostDiagnostic(diagnostic: Diagnostic, lessonBaseUrl: string | null): HostDiagnostic {
  const message = diagnostic.help === undefined ? diagnostic.message : `${diagnostic.message}\n${diagnostic.help}`;
  const lessonUrl = lessonBaseUrl !== null && diagnostic.lesson !== undefined ? `${lessonBaseUrl.replace(TRAILING_SLASHES, '')}/${diagnostic.lesson}` : undefined;
  return {
    code: diagnostic.code,
    severity: diagnostic.severity,
    message,
    startLine: diagnostic.range.start.line - 1,
    startCharacter: diagnostic.range.start.column - 1,
    endLine: diagnostic.range.end.line - 1,
    endCharacter: diagnostic.range.end.column - 1,
    ...(lessonUrl === undefined ? {} : { lessonUrl }),
  };
}
