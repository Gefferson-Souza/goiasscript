import { STDLIB, lookupStdlibGlobal } from '@goiasscript/language';
import type { StdlibEntry } from '@goiasscript/language';

const NAMESPACE_SEPARATOR = '.';
const INSTANCE_RECEIVER_EXCLUDED: ReadonlySet<string> = new Set(['global', 'namespace']);

export const LIBRARY_GLOBAL_NAMES: readonly string[] = STDLIB.filter((entry) => entry.receiver === 'global').map((entry) => entry.name);

export const INSTANCE_MEMBER_NAMES: readonly string[] = [
  ...new Set(STDLIB.filter((entry) => !INSTANCE_RECEIVER_EXCLUDED.has(entry.receiver)).map((entry) => entry.name)),
];

export const resolveLibraryGlobal = (name: string): StdlibEntry | undefined => lookupStdlibGlobal(name);

export function staticMemberNames(namespace: string): readonly string[] {
  const prefix = `${namespace}${NAMESPACE_SEPARATOR}`;
  return STDLIB.filter((entry) => entry.receiver === 'namespace' && entry.name.startsWith(prefix)).map((entry) => entry.name.slice(prefix.length));
}
