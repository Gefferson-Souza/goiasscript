import { WARNING_CODES } from '@goiasscript/language';
import type { CoreDiagnostic } from '../api.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import type { SourceText } from '../source/source.types.ts';
import { rangeOf } from '../source/source-text.ts';

export const toCoreDiagnostic = (raw: RawDiagnostic, source: SourceText): CoreDiagnostic => ({
  code: raw.code,
  severity: WARNING_CODES.has(raw.code) ? 'warning' : 'error',
  range: rangeOf(source, raw.start, raw.end),
  args: raw.args,
});
