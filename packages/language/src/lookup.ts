import { DIAGNOSTICS } from './diagnostics/index.ts';
import type { DiagnosticDefinition } from './diagnostics/diagnostics.types.ts';
import { JS_MEMBER_ALTERNATIVES, JS_MEMBER_EXTRA_EQUIVALENTS, JS_RESERVED } from './js/js-reserved.data.ts';
import { JS_MEMBER_NAMES } from './js/js-members.generated.ts';
import type { JsMemberEntry, JsReservedEntry } from './js/js-reserved.types.ts';
import { KEYWORDS } from './keywords/keywords.data.ts';
import type { KeywordEntry } from './keywords/keywords.types.ts';
import { RETIRED_WORDS } from './retired/retired-words.data.ts';
import type { RetiredWord } from './retired/retired-words.types.ts';
import { STDLIB } from './stdlib/index.ts';
import type { StdlibEntry } from './stdlib/stdlib.types.ts';

const HELPER_PREFIX = '$gs_';
const isDefined = (value: string | undefined): value is string => value !== undefined;
const KEYWORDS_BY_SPELLING: ReadonlyMap<string, KeywordEntry> = new Map(
  KEYWORDS.flatMap((entry) => [entry.spelling, entry.asciiSpelling].filter(isDefined).map((name) => [name, entry] as const)),
);
const RESERVED_BY_NAME: ReadonlyMap<string, JsReservedEntry> = new Map(JS_RESERVED.map((entry) => [entry.name, entry]));
const RETIRED_BY_WORD: ReadonlyMap<string, RetiredWord> = new Map(RETIRED_WORDS.map((entry) => [entry.word, entry]));
const DIAGNOSTICS_BY_CODE: ReadonlyMap<string, DiagnosticDefinition> = new Map(DIAGNOSTICS.map((entry) => [entry.code, entry]));
const JS_MEMBER_SET: ReadonlySet<string> = new Set(JS_MEMBER_NAMES);
const INSTANCE_ENTRIES = STDLIB.filter((entry) => entry.receiver !== 'global' && entry.receiver !== 'namespace');
const jsMemberName = (js: string): string => js.slice(js.lastIndexOf('.') + 1);
const EQUIVALENT_BY_JS_NAME: ReadonlyMap<string, string> = new Map([
  ...Object.entries(JS_MEMBER_EXTRA_EQUIVALENTS),
  ...STDLIB.filter((entry) => entry.receiver !== 'global' && !entry.js.startsWith(HELPER_PREFIX)).map((entry) => [jsMemberName(entry.js), entry.name] as const),
]);
const matchesName = (entry: StdlibEntry, name: string): boolean => entry.name === name || entry.asciiName === name;

export const lookupDiagnostic = (code: string): DiagnosticDefinition | undefined => DIAGNOSTICS_BY_CODE.get(code);
export const lookupKeyword = (nfcSpelling: string): KeywordEntry | undefined => KEYWORDS_BY_SPELLING.get(nfcSpelling);
export const lookupJsReserved = (name: string): JsReservedEntry | undefined => RESERVED_BY_NAME.get(name);
export const lookupRetiredWord = (word: string): RetiredWord | undefined => RETIRED_BY_WORD.get(word);
export const lookupStdlibMember = (name: string): readonly StdlibEntry[] => INSTANCE_ENTRIES.filter((entry) => matchesName(entry, name));
export const lookupStdlibGlobal = (name: string): StdlibEntry | undefined => STDLIB.find((entry) => entry.receiver === 'global' && matchesName(entry, name));
export const lookupStdlibStatic = (namespace: string, member: string): StdlibEntry | undefined =>
  STDLIB.find((entry) => entry.receiver === 'namespace' && matchesName(entry, `${namespace}.${member}`));

export function lookupJsMember(name: string): JsMemberEntry | undefined {
  if (!JS_MEMBER_SET.has(name)) return undefined;
  const equivalent = EQUIVALENT_BY_JS_NAME.get(name);
  const alternative = JS_MEMBER_ALTERNATIVES[name];
  return { name, ...(equivalent === undefined ? {} : { equivalent }), ...(alternative === undefined ? {} : { alternative }) };
}
