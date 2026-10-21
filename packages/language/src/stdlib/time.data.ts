import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry } from './stdlib-builders.ts';

export const TIME_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('daqui_um_cadim', 'setTimeout', ARITY.two, 'proposal'),
  globalEntry('toda_hora', 'setInterval', ARITY.two, 'proposal'),
  globalEntry('larga_mão', 'clearTimeout', ARITY.one, 'proposal'),
  globalEntry('cochila', '$gs_cochila', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'cochila' }),
];
