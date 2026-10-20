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

export const BINARY_PRECEDENCE: ReadonlyMap<string, number> = new Map([
  ['ou_então', 3], ['||', 3], ['e_mais', 4], ['&&', 4],
  ['é_igualim', 8], ['diferente', 8], ['==', 8], ['===', 8], ['!=', 8], ['!==', 8],
  ['<', 9], ['>', 9], ['<=', 9], ['>=', 9], ['maior_que', 9], ['menor_que', 9], ['pelo_menos', 9], ['no_máximo', 9], ['é_tipo_de', 9],
  ['+', 11], ['-', 11], ['mais', 11], ['menos', 11],
  ['*', 12], ['/', 12], ['%', 12], ['vezes', 12], ['dividido', 12], ['sobrou', 12],
]);

export const PRECEDENCE_ASSIGNMENT = 1;
export const PRECEDENCE_UNARY = 14;
// Espelha LIMITS.maxNestingDepth do pacote language, que ainda não existe no spike.
export const MAX_NESTING_DEPTH = 200;

export const JS_OPERATOR_FORMS: ReadonlyMap<string, string> = new Map([
  ['=', 'é'], ['==', 'é_igualim'], ['===', 'é_igualim'], ['!=', 'diferente'], ['!==', 'diferente'], ['&&', 'e_mais'],
  ['||', 'ou_então'], ['!', 'num_é'], ['++', 'i é i mais 1'], ['--', 'i é i menos 1'], ['+=', 'i é i mais 1'],
  ['-=', 'i é i menos 1'], ['*=', 'i é i vezes 2'], ['/=', 'i é i dividido 2'], ['%=', 'i é i sobrou 2'],
]);

export const ASSIGNMENT_PUNCTUATORS: ReadonlySet<string> = new Set(['=', '+=', '-=', '*=', '/=', '%=']);
export const BINARY_ONLY_PUNCTUATORS: ReadonlySet<string> = new Set(['*', '/', '%', '<', '>', '<=', '>=', '&&', '||', '==', '===', '!=', '!==']);

export const JS_KEYWORD_EQUIVALENT: ReadonlyMap<string, string> = new Map([
  ['const', 'uai'], ['let', 'trem'], ['var', 'trem'], ['function', 'faz_trem'], ['return', 'faz_favor'], ['if', 'se_ocê_quiser'],
  ['else', 'se_não'], ['for', 'vai_indo'], ['while', 'enquanto_tiver'], ['break', 'para_com_isso'], ['continue', 'continua_aí'],
  ['class', 'arruma_trem'], ['extends', 'inherda_de'], ['new', 'faz_um'], ['this', 'ocê'], ['try', 'tenta_aí'],
  ['catch', 'se_der_ruim'], ['finally', 'por_fim'], ['throw', 'vixe'], ['async', 'vai_na_frente'], ['await', 'espera_um_cadim'],
  ['true', 'certeza'], ['false', 'de_jeito_nenhum'], ['null', 'nada'], ['undefined', 'indefinido'], ['instanceof', 'é_tipo_de'],
]);

export const JS_GLOBALS: ReadonlyMap<string, string> = new Map([
  ['console', 'prosa'], ['setTimeout', 'daqui_a_pouco'], ['setInterval', 'toda_hora'], ['Math', 'Conta'], ['Promise', 'promessa'],
  ['Error', 'Erro'], ['Date', 'Data'], ['Object', 'Coisa'],
]);
