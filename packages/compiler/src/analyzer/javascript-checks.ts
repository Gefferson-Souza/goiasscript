import { lookupJsMember, lookupJsReserved, lookupStdlibMember, lookupStdlibStatic } from '@goiasscript/language';
import type { Identifier } from '../ast/ast.types.ts';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import { CODES } from './codes.constants.ts';
import { diagnostic } from './diagnostic.ts';
import { INSTANCE_MEMBER_NAMES, staticMemberNames } from './library-scope.ts';
import type { MemberAccessQuery } from './javascript-checks.types.ts';
import { PROTOTYPE_MEMBERS } from './javascript-checks.constants.ts';
import { closestName, suggestFreshName } from './name-checks.ts';

function reservedWordDiagnostic(name: string, start: number, end: number): RawDiagnostic | undefined {
  const reserved = lookupJsReserved(name);
  if (reserved === undefined) return undefined;
  if (reserved.kind === 'keyword' || reserved.kind === 'strict-reserved') {
    return diagnostic(reserved.hasEquivalent ? CODES.jsKeyword : CODES.jsWordWithoutEquivalent, start, end, { name, suggestion: reserved.suggestion });
  }
  return undefined;
}

// Nome que o aluno declara (variável, função, classe, parâmetro): palavra da linguagem ou do JavaScript não serve.
export function checkBindingName(identifier: Identifier): RawDiagnostic | undefined {
  const { name, start, end } = identifier;
  if (identifier.reservedKeyword !== undefined) return diagnostic(CODES.keywordAsName, start, end, { name, suggestion: suggestFreshName(name) });
  const reserved = lookupJsReserved(name);
  if (reserved === undefined) return undefined;
  if (reserved.kind === 'non-bindable') return diagnostic(CODES.jsWordWithoutEquivalent, start, end, { name, suggestion: reserved.suggestion });
  if (reserved.kind === 'global') return diagnostic(CODES.jsGlobal, start, end, { name, suggestion: reserved.suggestion });
  return reservedWordDiagnostic(name, start, end);
}

function jsMemberDiagnostic(name: string, start: number, end: number): RawDiagnostic | undefined {
  const member = lookupJsMember(name);
  if (member?.equivalent !== undefined) return diagnostic(CODES.jsMemberWithName, start, end, { name, suggestion: member.equivalent });
  return undefined;
}

// Chave de coisa, método de classe ou alvo `x.nome é …`: o nome nasce aqui, então só o JavaScript puro é barrado.
export function checkDeclaredMember(name: string, start: number, end: number): RawDiagnostic | undefined {
  if (PROTOTYPE_MEMBERS.has(name)) return diagnostic(CODES.jsMemberWithoutName, start, end, { name });
  return jsMemberDiagnostic(name, start, end) ?? reservedWordDiagnostic(name, start, end);
}

function isKnownMember(query: MemberAccessQuery): boolean {
  if (query.declared.has(query.name)) return true;
  if (query.namespace !== undefined) return lookupStdlibStatic(query.namespace, query.name) !== undefined;
  return lookupStdlibMember(query.name).length > 0;
}

function unknownMemberDiagnostic(query: MemberAccessQuery): RawDiagnostic {
  const { name, start, end, namespace, declared } = query;
  const candidates = namespace === undefined ? [...declared, ...INSTANCE_MEMBER_NAMES] : staticMemberNames(namespace);
  const suggestion = closestName(name, candidates);
  return diagnostic(CODES.undeclaredMember, start, end, suggestion === undefined ? { name } : { name, suggestion });
}

// Acesso `x.nome` ou `x["nome"]`: só vale nome declarado no arquivo ou da biblioteca.
export function checkMemberAccess(query: MemberAccessQuery): RawDiagnostic | undefined {
  const { name, start, end } = query;
  if (PROTOTYPE_MEMBERS.has(name)) return diagnostic(CODES.jsMemberWithoutName, start, end, { name });
  if (isKnownMember(query)) return undefined;
  const equivalent = jsMemberDiagnostic(name, start, end) ?? reservedWordDiagnostic(name, start, end);
  if (equivalent !== undefined) return equivalent;
  if (lookupJsMember(name) !== undefined) return diagnostic(CODES.jsMemberWithoutName, start, end, { name });
  return unknownMemberDiagnostic(query);
}
