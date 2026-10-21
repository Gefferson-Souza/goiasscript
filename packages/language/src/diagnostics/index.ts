import type { DiagnosticDefinition } from './diagnostics.types.ts';
import { HINTS_DIAGNOSTICS } from './hints.data.ts';
import { JAVASCRIPT_DIAGNOSTICS } from './javascript.data.ts';
import { LEXICAL_DIAGNOSTICS } from './lexical.data.ts';
import { LIBRARY_DIAGNOSTICS } from './library.data.ts';
import { NAMES_DIAGNOSTICS } from './names.data.ts';
import { RUNTIME_DIAGNOSTICS } from './runtime.data.ts';
import { SUBSET_DIAGNOSTICS } from './subset.data.ts';
import { SYNTAX_DIAGNOSTICS } from './syntax.data.ts';
import { TOOLS_DIAGNOSTICS } from './tools.data.ts';

export const DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  ...LEXICAL_DIAGNOSTICS,
  ...SYNTAX_DIAGNOSTICS,
  ...NAMES_DIAGNOSTICS,
  ...JAVASCRIPT_DIAGNOSTICS,
  ...SUBSET_DIAGNOSTICS,
  ...LIBRARY_DIAGNOSTICS,
  ...RUNTIME_DIAGNOSTICS,
  ...HINTS_DIAGNOSTICS,
  ...TOOLS_DIAGNOSTICS,
];
