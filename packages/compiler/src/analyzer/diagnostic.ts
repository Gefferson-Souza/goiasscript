import type { RawDiagnostic } from '../lexer/token.types.ts';
import type { DiagnosticArgs } from './diagnostic.types.ts';

export const diagnostic = (code: string, start: number, end: number, args: DiagnosticArgs = {}, lesson?: string | null): RawDiagnostic => ({
  code,
  start,
  end,
  args,
  ...(lesson === undefined ? {} : { lesson }),
});
