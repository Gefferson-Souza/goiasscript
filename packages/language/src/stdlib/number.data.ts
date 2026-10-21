import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry, instanceMethod } from './stdlib-builders.ts';

export const NUMBER_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('vira_número', '$gs_vira_numero', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'vira_numero' }),
  globalEntry('é_número', '$gs_e_numero', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'e_numero' }),
  instanceMethod('com_casas', 'number', 'toFixed', ARITY.one, 'proposal'),
];
