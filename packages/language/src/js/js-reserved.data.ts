import type { JsReservedEntry, JsReservedKind } from './js-reserved.types.ts';

const STRICT_RESERVED: ReadonlySet<string> = new Set(['implements', 'interface', 'let', 'package', 'private', 'protected', 'public', 'static', 'yield']);

const KEYWORDS_WITH_EQUIVALENT = {
  var: 'trem', let: 'trem', const: 'uai', function: 'faz_trem', return: 'faz_favor', if: 'se_ocê_quiser', else: 'se_não',
  for: 'vai_indo', while: 'enquanto_tiver', break: 'para_com_isso', continue: 'continua_aí', class: 'arruma_trem',
  extends: 'inherda_de', constructor: 'aprepara_trem', static: 'num_muda', super: 'a_raiz', this: 'ocê', new: 'faz_um',
  instanceof: 'é_tipo_de', try: 'tenta_aí', catch: 'se_der_ruim', finally: 'por_fim', throw: 'vixe',
  async: 'vai_na_frente', await: 'espera_um_cadim', true: 'certeza', false: 'de_jeito_nenhum', null: 'nada',
  undefined: 'indefinido', in: 'em', of: 'de',
} as const;
const KEYWORDS_WITHOUT_EQUIVALENT: readonly string[] = [
  'switch', 'case', 'default', 'do', 'typeof', 'delete', 'void', 'yield', 'import', 'export', 'debugger', 'with', 'enum',
  'implements', 'interface', 'package', 'private', 'protected', 'public',
];
const GLOBALS_WITH_EQUIVALENT = {
  console: 'prosa', Math: 'Conta', Object: 'Coisa', JSON: 'Coisa', String: 'vira_texto', Number: 'vira_número', Promise: 'Promessa',
  Date: 'Data', Error: 'Erro', setTimeout: 'daqui_um_cadim', setInterval: 'toda_hora', clearTimeout: 'larga_mão',
  clearInterval: 'larga_mão', parseInt: 'vira_número', parseFloat: 'vira_número', isNaN: 'é_número',
} as const;
const GLOBALS_WITHOUT_EQUIVALENT: readonly string[] = [
  'Array', 'Boolean', 'RegExp', 'Map', 'Set', 'Symbol', 'isFinite', 'globalThis', 'window', 'document', 'fetch', 'require',
  'module', 'process', 'Function', 'Reflect', 'Proxy', 'Intl',
];
const NON_BINDABLE: readonly string[] = ['arguments', 'eval', 'NaN', 'Infinity'];

function withoutWord(names: readonly string[], kind: JsReservedKind): readonly JsReservedEntry[] {
  return names.map((name) => ({ name, hasEquivalent: false, kind: kind === 'keyword' && STRICT_RESERVED.has(name) ? 'strict-reserved' : kind }));
}

function entries(source: Readonly<Record<string, string>>, kind: JsReservedKind, hasEquivalent: boolean): readonly JsReservedEntry[] {
  return Object.entries(source).map(([name, suggestion]) => ({
    name, suggestion, hasEquivalent, kind: kind === 'keyword' && STRICT_RESERVED.has(name) ? 'strict-reserved' : kind,
  }));
}

export const JS_RESERVED: readonly JsReservedEntry[] = [
  ...entries(KEYWORDS_WITH_EQUIVALENT, 'keyword', true), ...withoutWord(KEYWORDS_WITHOUT_EQUIVALENT, 'keyword'),
  ...entries(GLOBALS_WITH_EQUIVALENT, 'global', true), ...GLOBALS_WITHOUT_EQUIVALENT.map((name): JsReservedEntry => ({ name, kind: 'global', hasEquivalent: false })),
  ...withoutWord(NON_BINDABLE, 'non-bindable'),
];

export const JS_MEMBER_ALTERNATIVES: Readonly<Record<string, string>> = { hasOwnProperty: 'Coisa.tem', toString: 'vira_texto' };

export const JS_MEMBER_EXTRA_EQUIVALENTS: Readonly<Record<string, string>> = { sort: 'arruma', reverse: 'de_trás_pra_frente', replace: 'trocar' };
