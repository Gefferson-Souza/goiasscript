import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry, instanceMethod, staticMember } from './stdlib-builders.ts';

export const PROMISE_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('Promessa', 'Promise', ARITY.one, '1.5'),
  staticMember('Promessa', 'tudim_junto', 'Promise.all', 'method', ARITY.one, 'proposal'),
  instanceMethod('quando_der_bão', 'promise', 'then', ARITY.one, '1.5'),
  instanceMethod('se_der_ruim', 'promise', 'catch', ARITY.one, '1.5'),
];
