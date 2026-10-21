import type { Arity, StdlibEntry, StdlibEntrySpec, StdlibForm, StdlibOrigin, StdlibReceiver } from './stdlib.types.ts';

const LANGUAGE_SINCE = '3.0.0';

export const ARITY = {
  none: { min: 0, max: 0 }, optional: { min: 0, max: 1 }, one: { min: 1, max: 1 }, two: { min: 2, max: 2 },
  oneOrTwo: { min: 1, max: 2 }, atLeastOne: { min: 1 }, any: { min: 0 },
} as const satisfies Readonly<Record<string, Arity>>;

export function stripDiacritics(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '');
}

export function defineEntry(spec: StdlibEntrySpec): StdlibEntry {
  const asciiName = stripDiacritics(spec.name);
  return { semantics: 'native', since: LANGUAGE_SINCE, ...spec, ...(asciiName === spec.name ? {} : { asciiName }) };
}

export function instanceMethod(name: string, receiver: StdlibReceiver, js: string, arity: Arity, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name, receiver, kind: 'rename', js, form: 'method', arity, origin, ...extra });
}
export function instanceProperty(name: string, receiver: StdlibReceiver, js: string, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name, receiver, kind: 'property', js, form: 'property', arity: ARITY.none, origin, ...extra });
}
export function staticMember(namespace: string, member: string, js: string, form: StdlibForm, arity: Arity, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name: `${namespace}.${member}`, receiver: 'namespace', kind: 'static', js, form, arity, origin, ...extra });
}
export function globalEntry(name: string, js: string, arity: Arity, origin: StdlibOrigin, extra: Partial<StdlibEntrySpec> = {}): StdlibEntry {
  return defineEntry({ name, receiver: 'global', kind: 'global', js, arity, origin, ...extra });
}
