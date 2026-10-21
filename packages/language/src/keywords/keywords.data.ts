import type { KeywordCategory, KeywordClass, KeywordEntry } from './keywords.types.ts';

const LANGUAGE_SINCE = '3.0.0';

function keyword(spelling: string, js: string, category: KeywordCategory, asciiSpelling?: string, keywordClass: KeywordClass = 'reserved'): KeywordEntry {
  return { spelling, js, category, keywordClass, since: LANGUAGE_SINCE, ...(asciiSpelling === undefined ? {} : { asciiSpelling }) };
}

export const KEYWORDS: readonly KeywordEntry[] = [
  keyword('uai', 'const', 'declaration'), keyword('trem', 'let', 'declaration'), keyword('é', '=', 'assignment'),
  keyword('faz_trem', 'function', 'function'), keyword('faz_favor', 'return', 'function'),
  keyword('vai_na_frente', 'async', 'function'), keyword('vai_na_frente_faz_trem', 'async function', 'function'),
  keyword('espera_um_cadim', 'await', 'function'),
  keyword('se_ocê_quiser', 'if', 'control', 'se_oce_quiser'), keyword('se_num_for', 'else if', 'control'),
  keyword('se_não', 'else', 'control', 'se_nao'), keyword('vai_indo', 'for', 'control'),
  keyword('enquanto_tiver', 'while', 'control'), keyword('para_com_isso', 'break', 'control'),
  keyword('continua_aí', 'continue', 'control', 'continua_ai'),
  keyword('de', 'of', 'control', undefined, 'contextual'), keyword('em', 'in', 'control', undefined, 'contextual'),
  keyword('arruma_trem', 'class', 'class'), keyword('inherda_de', 'extends', 'class'),
  keyword('aprepara_trem', 'constructor', 'class'), keyword('num_muda', 'static', 'class'),
  keyword('a_raiz', 'super', 'class'), keyword('ocê', 'this', 'class', 'oce'), keyword('faz_um', 'new', 'class'),
  keyword('é_tipo_de', 'instanceof', 'class', 'e_tipo_de'),
  keyword('tenta_aí', 'try', 'error', 'tenta_ai'), keyword('se_der_ruim', 'catch', 'error'),
  keyword('por_fim', 'finally', 'error'), keyword('vixe', 'throw', 'error'),
  keyword('certeza', 'true', 'literal'), keyword('de_jeito_nenhum', 'false', 'literal'),
  keyword('nada', 'null', 'literal'), keyword('indefinido', 'undefined', 'literal'),
  keyword('é_igualim', '===', 'operator', 'e_igualim'), keyword('diferente', '!==', 'operator'),
  keyword('maior_que', '>', 'operator'), keyword('menor_que', '<', 'operator'),
  keyword('pelo_menos', '>=', 'operator'), keyword('no_máximo', '<=', 'operator', 'no_maximo'),
  keyword('e_mais', '&&', 'operator'), keyword('ou_então', '||', 'operator', 'ou_entao'),
  keyword('num_é', '!', 'operator', 'num_e'), keyword('mais', '+', 'operator'), keyword('menos', '-', 'operator'),
  keyword('vezes', '*', 'operator'), keyword('dividido', '/', 'operator'), keyword('sobrou', '%', 'operator'),
];
