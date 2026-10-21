import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry } from './stdlib-builders.ts';

export const IO_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('prosa', 'console.log', ARITY.any, 'owner'),
  globalEntry('reclama', 'console.error', ARITY.any, '1.5'),
  globalEntry('avisa', 'console.warn', ARITY.any, 'proposal'),
  globalEntry('pergunta', '$gs_pergunta', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'pergunta' }),
];
