import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry, staticMember } from './stdlib-builders.ts';

export const MATH_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('Conta', 'Math', ARITY.any, 'proposal'),
  staticMember('Conta', 'sorteia_um', '$gs_sorteia_um', 'method', ARITY.two, 'owner', { kind: 'helper', semantics: 'didactic', helperName: 'sorteia_um' }),
  staticMember('Conta', 'arredondar', 'Math.round', 'method', ARITY.one, 'owner'),
  staticMember('Conta', 'arredondar_pra_baixo', 'Math.floor', 'method', ARITY.one, 'proposal'),
  staticMember('Conta', 'arredondar_pra_cima', 'Math.ceil', 'method', ARITY.one, 'proposal'),
  staticMember('Conta', 'maior', 'Math.max', 'method', ARITY.atLeastOne, 'owner'),
  staticMember('Conta', 'menor', 'Math.min', 'method', ARITY.atLeastOne, 'proposal'),
  staticMember('Conta', 'ranca_o_sinal', 'Math.abs', 'method', ARITY.one, 'proposal'),
  staticMember('Conta', 'raiz_quadrada', 'Math.sqrt', 'method', ARITY.one, 'proposal'),
  staticMember('Conta', 'elevado_a', 'Math.pow', 'method', ARITY.two, 'proposal'),
  staticMember('Conta', 'PI', 'Math.PI', 'property', ARITY.none, 'proposal'),
  staticMember('Conta', 'E', 'Math.E', 'property', ARITY.none, 'proposal'),
];
