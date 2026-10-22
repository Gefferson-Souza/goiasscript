import type { JsonReportInput } from './diagnostic.types.ts';

const REPORT_VERSION = 1;
const LINE_SEPARATORS = /[\p{Zl}\p{Zp}]/gu;
const HEX_RADIX = 16;

export function renderJsonReport(report: JsonReportInput): string {
  const body = JSON.stringify({
    version: REPORT_VERSION,
    file: report.file,
    ok: report.diagnostics.every((diagnostic) => diagnostic.severity !== 'error'),
    diagnostics: report.diagnostics,
  });
  const escaped = body.replace(LINE_SEPARATORS, (char) => `\\u${(char.codePointAt(0) ?? 0).toString(HEX_RADIX)}`);
  return `${escaped}\n`;
}
