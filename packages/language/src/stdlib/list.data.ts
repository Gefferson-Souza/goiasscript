import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, instanceMethod } from './stdlib-builders.ts';

export const LIST_ENTRIES: readonly StdlibEntry[] = [
  instanceMethod('bota_no_final', 'list', 'push', ARITY.atLeastOne, 'owner'),
  instanceMethod('ranca_o_rabo', 'list', 'pop', ARITY.none, 'owner'),
  instanceMethod('bota_no_começo', 'list', 'unshift', ARITY.atLeastOne, 'proposal'),
  instanceMethod('ranca_a_cabeça', 'list', 'shift', ARITY.none, 'proposal'),
  instanceMethod('ranca_do_meio', 'list', 'splice', ARITY.two, 'proposal'),
  instanceMethod('mapear', 'list', 'map', ARITY.one, 'owner'),
  instanceMethod('filtrar', 'list', 'filter', ARITY.one, 'owner'),
  instanceMethod('amontoar', 'list', 'reduce', ARITY.two, 'proposal'),
  instanceMethod('pra_cada', 'list', 'forEach', ARITY.one, 'proposal'),
  instanceMethod('cata', 'list', 'find', ARITY.one, 'proposal', { alternatives: ['procura'] }),
  instanceMethod('onde_tá_o', 'list', 'findIndex', ARITY.one, 'proposal'),
  instanceMethod('tem_algum', 'list', 'some', ARITY.one, 'proposal'),
  instanceMethod('todin', 'list', 'every', ARITY.one, 'proposal'),
  instanceMethod('ajunta', 'list', 'join', ARITY.one, 'proposal', { alternatives: ['unir'] }),
  instanceMethod('emenda', 'list', 'concat', ARITY.one, 'proposal'),
  instanceMethod('de_trás_pra_frente', 'list', 'toReversed', ARITY.none, 'proposal'),
  instanceMethod('arruma', 'list', 'toSorted', ARITY.none, 'proposal', { kind: 'helper', semantics: 'didactic', helperName: 'ordem' }),
];
