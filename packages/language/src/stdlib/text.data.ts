import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry, instanceMethod, instanceProperty } from './stdlib-builders.ts';

export const TEXT_ENTRIES: readonly StdlibEntry[] = [
  instanceMethod('gritando', 'text', 'toUpperCase', ARITY.none, 'owner'),
  instanceMethod('cochichando', 'text', 'toLowerCase', ARITY.none, 'owner'),
  instanceMethod('tem_no_meio', 'textOrList', 'includes', ARITY.one, 'owner'),
  instanceMethod('trocar', 'text', 'replaceAll', ARITY.two, 'owner', { kind: 'helper', semantics: 'didactic', helperName: 'trocar' }),
  instanceMethod('dividir', 'text', 'split', ARITY.one, 'owner'),
  instanceMethod('ranca_os_espaço', 'text', 'trim', ARITY.none, 'proposal'),
  instanceMethod('começa_com', 'text', 'startsWith', ARITY.one, 'proposal'),
  instanceMethod('termina_com', 'text', 'endsWith', ARITY.one, 'proposal'),
  instanceMethod('naco', 'textOrList', 'slice', ARITY.oneOrTwo, 'proposal'),
  instanceMethod('onde_tá', 'textOrList', 'indexOf', ARITY.one, 'proposal'),
  instanceProperty('o_tanto', 'textOrList', 'length', 'proposal', { alternatives: ['quantidade', 'total'] }),
  instanceMethod('repete', 'text', 'repeat', ARITY.one, 'proposal', { alternatives: ['repeticoes'] }),
  globalEntry('vira_texto', '$gs_vira_texto', ARITY.one, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'vira_texto' }),
];
