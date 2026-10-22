import { lookupStdlibMember } from '@goiasscript/language';
import type { Arity, StdlibEntry } from '@goiasscript/language';
import type { RawDiagnostic } from '../lexer/token.types.ts';
import { CODES } from './codes.constants.ts';
import { diagnostic } from './diagnostic.ts';
import type { DiagnosticArgs } from './diagnostic.types.ts';
import { ARGUMENT_PLACEHOLDER, EXPECTED_FORM, GUARANTEED_DATA, RECEIVER_LABEL } from './library-checks.constants.ts';
import type { MemberValue } from './library-checks.types.ts';
import { suggestFreshName } from './name-checks.ts';

const NAMESPACE_SEPARATOR = '.';
const memberLabel = (entry: StdlibEntry): string => entry.name.slice(entry.name.lastIndexOf(NAMESPACE_SEPARATOR) + 1);
const shortName = (entry: StdlibEntry): StdlibEntry => ({ ...entry, name: memberLabel(entry) });

const isCallableValue = (value: MemberValue): boolean => value === 'method' || !GUARANTEED_DATA.has(value.type);

// Propriedade da biblioteca reserva o nome sempre; método só reserva se o membro puder ser chamado.
export function reservedEntries(name: string, value: MemberValue): readonly StdlibEntry[] {
  const entries = lookupStdlibMember(name);
  if (entries.some((entry) => entry.form === 'property')) return entries;
  return entries.some((entry) => entry.form === 'method') && isCallableValue(value) ? entries : [];
}

export function reservationDiagnostic(name: string, entries: readonly StdlibEntry[], start: number, end: number): RawDiagnostic {
  const labels = [...new Set(entries.map((entry) => RECEIVER_LABEL[entry.receiver]))];
  const suggestion = entries.flatMap((entry) => entry.alternatives ?? [])[0] ?? suggestFreshName(name);
  return diagnostic(CODES.libraryNameAsMember, start, end, { name, description: `${name} de ${labels.join(' e de ')}`, suggestion });
}

function arityPhrase(arity: Arity): string {
  if (arity.max === undefined) return `pelo menos ${String(arity.min)}`;
  if (arity.min === arity.max) return `${String(arity.min)} ${arity.min === 1 ? 'argumento' : 'argumentos'}`;
  return `de ${String(arity.min)} a ${String(arity.max)} argumentos`;
}

const isArityViolation = (arity: Arity, received: number): boolean => received < arity.min || (arity.max !== undefined && received > arity.max);

function arityArgs(entry: StdlibEntry, received: number): DiagnosticArgs {
  const slots = Array.from({ length: entry.arity.max ?? entry.arity.min }, () => ARGUMENT_PLACEHOLDER).join(', ');
  return { name: entry.name, arity: arityPhrase(entry.arity), received: String(received), signature: `${entry.name}(${slots})` };
}

// Chamada de membro da biblioteca: propriedade chamada com parênteses (GS0603) ou número de argumentos errado (GS0604).
export function checkCallShape(entry: StdlibEntry, argumentCount: number, start: number, end: number): RawDiagnostic | undefined {
  if (entry.form === 'property') return diagnostic(CODES.wrongMemberForm, start, end, { name: memberLabel(entry), expected: EXPECTED_FORM.property });
  if (isArityViolation(entry.arity, argumentCount)) return diagnostic(CODES.wrongArgumentCount, start, end, arityArgs(shortName(entry), argumentCount));
  return undefined;
}

// Método usado como valor, sem parênteses (GS0603).
export function methodAsValueDiagnostic(entry: StdlibEntry, start: number, end: number): RawDiagnostic {
  return diagnostic(CODES.wrongMemberForm, start, end, { name: memberLabel(entry), expected: EXPECTED_FORM.method });
}
