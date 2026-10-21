import type { StdlibEntry } from './stdlib.types.ts';
import { ARITY, globalEntry, staticMember } from './stdlib-builders.ts';

export const OBJECT_ENTRIES: readonly StdlibEntry[] = [
  globalEntry('Coisa', 'Object', ARITY.any, 'proposal'),
  staticMember('Coisa', 'chaves', 'Object.keys', 'method', ARITY.one, 'proposal'),
  staticMember('Coisa', 'valores', 'Object.values', 'method', ARITY.one, 'proposal'),
  staticMember('Coisa', 'entradas', 'Object.entries', 'method', ARITY.one, 'proposal'),
  staticMember('Coisa', 'tem', 'Object.hasOwn', 'method', ARITY.two, 'proposal'),
  staticMember('Coisa', 'mistura', 'Object.assign', 'method', ARITY.two, 'proposal', { kind: 'macro' }),
  staticMember('Coisa', 'vira_texto', 'JSON.stringify', 'method', ARITY.one, 'proposal'),
  staticMember('Coisa', 'vira_coisa', 'JSON.parse', 'method', ARITY.one, 'proposal'),
];
