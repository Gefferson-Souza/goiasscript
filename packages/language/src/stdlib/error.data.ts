import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry, instanceProperty } from './stdlib-builders.ts';

export const ERROR_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('Erro', 'Error', ARITY.optional, 'proposal'),
  instanceProperty('mensagem', 'error', 'message', 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'mensagem', alternatives: ['texto', 'aviso'] }),
];
