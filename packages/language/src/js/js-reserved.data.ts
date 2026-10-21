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
const KEYWORDS_WITHOUT_EQUIVALENT = {
  switch: 'opcao', case: 'caso', default: 'padrao', do: 'repeticao', typeof: 'tipo', delete: 'apagar', void: 'vago',
  yield: 'cede', import: 'importar', export: 'exportar', debugger: 'depurar', with: 'com', enum: 'enumeracao',
  implements: 'implementacao', interface: 'contrato', package: 'pacote', private: 'privado', protected: 'protegido', public: 'publico',
} as const;
const GLOBALS_WITH_EQUIVALENT = {
  console: 'prosa', Math: 'Conta', Object: 'Coisa', JSON: 'Coisa', String: 'vira_texto', Number: 'vira_número', Promise: 'Promessa',
  Date: 'Data', Error: 'Erro', setTimeout: 'daqui_um_cadim', setInterval: 'toda_hora', clearTimeout: 'larga_mão',
  clearInterval: 'larga_mão', parseInt: 'vira_número', parseFloat: 'vira_número', isNaN: 'é_número',
} as const;
const GLOBALS_WITHOUT_EQUIVALENT = {
  Array: 'lista', Boolean: 'valor_logico', RegExp: 'padrao', Map: 'mapa', Set: 'conjunto', Symbol: 'simbolo',
  isFinite: 'e_finito', globalThis: 'global', window: 'janela', document: 'documento', fetch: 'busca', require: 'requisito',
  module: 'modulo', process: 'processo', Function: 'funcao', Reflect: 'reflexo', Proxy: 'intermediario', Intl: 'internacional',
} as const;
const NON_BINDABLE = { arguments: 'argumentos', eval: 'avaliar', NaN: 'nao_numero', Infinity: 'infinito' } as const;

function entries(source: Readonly<Record<string, string>>, kind: JsReservedKind, hasEquivalent: boolean): readonly JsReservedEntry[] {
  return Object.entries(source).map(([name, suggestion]) => ({
    name, suggestion, hasEquivalent, kind: kind === 'keyword' && STRICT_RESERVED.has(name) ? 'strict-reserved' : kind,
  }));
}

export const JS_RESERVED: readonly JsReservedEntry[] = [
  ...entries(KEYWORDS_WITH_EQUIVALENT, 'keyword', true), ...entries(KEYWORDS_WITHOUT_EQUIVALENT, 'keyword', false),
  ...entries(GLOBALS_WITH_EQUIVALENT, 'global', true), ...entries(GLOBALS_WITHOUT_EQUIVALENT, 'global', false),
  ...entries(NON_BINDABLE, 'non-bindable', false),
];

export const JS_MEMBER_EXTRA_EQUIVALENTS: Readonly<Record<string, string>> = { sort: 'arruma', reverse: 'de_trás_pra_frente', replace: 'trocar' };
