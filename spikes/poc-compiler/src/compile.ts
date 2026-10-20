import { createLineTable, toDiagnostic } from './diagnostics.ts';
import { applyEdits, lower } from './emit.ts';
import { createLexer } from './lexer.ts';
import { parse } from './parser.ts';
import type { Diagnostic } from './token.types.ts';

export type CompileResult =
  | { readonly ok: true; readonly code: string; readonly diagnostics: readonly Diagnostic[] }
  | { readonly ok: false; readonly diagnostics: readonly Diagnostic[]; readonly incomplete: boolean };

export function compile(text: string): CompileResult {
  const table = createLineTable(text);
  try {
    const lexer = createLexer(text);
    const { program, diagnostics, incomplete } = parse(text, lexer);
    const raws = [...lexer.diagnostics, ...diagnostics].sort((a, b) => a.start - b.start);
    if (raws.length > 0) return { ok: false, diagnostics: raws.map((raw) => toDiagnostic(raw, table)), incomplete };
    return { ok: true, code: applyEdits(text, lower(program, text)), diagnostics: [] };
  } catch {
    return { ok: false, diagnostics: [toDiagnostic({ code: 'GS0901', start: 0, end: 0, args: {} }, table)], incomplete: false };
  }
}
