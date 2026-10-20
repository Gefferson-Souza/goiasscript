import type { KeywordInfo } from './token.types.ts';

type KeywordRow = readonly [spelling: string, js: string, contextual?: boolean, asciiSpelling?: string];

const KEYWORD_ROWS: readonly KeywordRow[] = [
  ['uai', 'const'], ['trem', 'let'], ['é', '='], ['faz_trem', 'function'], ['faz_favor', 'return'],
  ['vai_na_frente', 'async'], ['vai_na_frente_faz_trem', 'async function'], ['espera_um_cadim', 'await'],
  ['se_ocê_quiser', 'if', false, 'se_oce_quiser'], ['se_num_for', 'else if'], ['se_não', 'else', false, 'se_nao'],
  ['vai_indo', 'for'], ['enquanto_tiver', 'while'], ['para_com_isso', 'break'], ['continua_aí', 'continue', false, 'continua_ai'],
  ['de', 'of', true], ['em', 'in', true], ['arruma_trem', 'class'], ['inherda_de', 'extends'], ['aprepara_trem', 'constructor'],
  ['num_muda', 'static'], ['a_raiz', 'super'], ['ocê', 'this', false, 'oce'], ['faz_um', 'new'],
  ['é_tipo_de', 'instanceof', false, 'e_tipo_de'], ['tenta_aí', 'try', false, 'tenta_ai'], ['se_der_ruim', 'catch'],
  ['por_fim', 'finally'], ['vixe', 'throw'], ['certeza', 'true'], ['de_jeito_nenhum', 'false'], ['nada', 'null'],
  ['indefinido', 'undefined'], ['é_igualim', '===', false, 'e_igualim'], ['diferente', '!=='], ['maior_que', '>'],
  ['menor_que', '<'], ['pelo_menos', '>='], ['no_máximo', '<=', false, 'no_maximo'], ['e_mais', '&&'],
  ['ou_então', '||', false, 'ou_entao'], ['num_é', '!', false, 'num_e'], ['mais', '+'], ['menos', '-'],
  ['vezes', '*'], ['dividido', '/'], ['sobrou', '%'],
];

export const KEYWORDS: ReadonlyMap<string, KeywordInfo> = new Map(
  KEYWORD_ROWS.flatMap(([spelling, js, contextual, ascii]) => {
    const info: KeywordInfo = { spelling, js, keywordClass: contextual ? 'contextual' : 'reserved' };
    return ascii ? [[spelling, info], [ascii, info]] : [[spelling, info]];
  }),
);

export const IDENTIFIER_PATTERN = /^[A-Za-z_áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ][A-Za-z0-9_áàâãéêíóôõúüçÁÀÂÃÉÊÍÓÔÕÚÜÇ]*$/;

export const PUNCTUATORS: readonly string[] = [
  '===', '!==', '==', '!=', '<=', '>=', '&&', '||', '++', '--', '+=', '-=', '*=', '/=', '%=', '**', '=>', '?.', '??',
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '(', ')', '[', ']', '{', '}', ',', '.', ';', ':', '?',
];
