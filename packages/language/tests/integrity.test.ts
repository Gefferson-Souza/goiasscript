import { describe, expect, it } from 'vitest';
import { JS_RESERVED } from '../src/js/js-reserved.data.ts';
import { JS_MEMBER_NAMES } from '../src/js/js-members.generated.ts';
import { KEYWORDS } from '../src/keywords/keywords.data.ts';
import { LIMITS } from '../src/limits.constants.ts';
import { RETIRED_WORDS } from '../src/retired/retired-words.data.ts';
import { DIAGNOSTICS } from '../src/diagnostics/index.ts';
import { STDLIB } from '../src/stdlib/index.ts';

const EXPECTED_KEYWORD_COUNT = 47;
const EXPECTED_RETIRED_COUNT = 14;
const EXPECTED_ASCII_VARIANTS = ['oce', 'se_oce_quiser', 'se_nao', 'no_maximo', 'continua_ai', 'tenta_ai', 'e_igualim', 'e_tipo_de', 'ou_entao', 'num_e'];
const MUST_BE_RESERVED = ['var', 'let', 'const', 'function', 'return', 'switch', 'typeof', 'yield', 'await', 'enum', 'public', 'package', 'static', 'constructor', 'console', 'Math', 'JSON', 'setTimeout', 'parseInt', 'Intl', 'arguments', 'eval', 'NaN', 'Infinity'];
const OWNER_NAMES = ['prosa', 'gritando', 'cochichando', 'tem_no_meio', 'trocar', 'dividir', 'bota_no_final', 'ranca_o_rabo', 'mapear', 'filtrar', 'Conta.sorteia_um', 'Conta.arredondar', 'Conta.maior'];
const DIDACTIC_NAMES = ['pergunta', 'arruma', 'trocar', 'vira_texto', 'Conta.sorteia_um', 'vira_número', 'é_número', 'cochila', 'mensagem', 'mês'];
const MEMBER_NAMES_SHARED_WITH_KEYWORDS = ['se_der_ruim'];

describe('keywords', () => {
  it('traz as 47 entradas da §4.2 com grafia em NFC', () => {
    expect(KEYWORDS).toHaveLength(EXPECTED_KEYWORD_COUNT);
    expect(KEYWORDS.every((entry) => entry.spelling === entry.spelling.normalize('NFC'))).toBe(true);
  });
  it('registra exatamente as dez variantes sem acento da §4.3', () => {
    const variants = KEYWORDS.flatMap((entry) => (entry.asciiSpelling === undefined ? [] : [entry.asciiSpelling]));
    expect([...variants].sort()).toEqual([...EXPECTED_ASCII_VARIANTS].sort());
  });
  it('toda keyword acentuada, exceto "é", tem variante', () => {
    const withoutVariant = KEYWORDS.filter((entry) => /[^\p{ASCII}]/u.test(entry.spelling) && entry.asciiSpelling === undefined);
    expect(withoutVariant.map((entry) => entry.spelling)).toEqual(['é']);
  });
  it('só "de" e "em" são contextuais', () => {
    const contextual = KEYWORDS.filter((entry) => entry.keywordClass === 'contextual').map((entry) => entry.spelling);
    expect([...contextual].sort()).toEqual(['de', 'em']);
  });
  it('mapeia o token JS emitido', () => {
    const jsOf = (spelling: string) => KEYWORDS.find((entry) => entry.spelling === spelling)?.js;
    expect([jsOf('se_num_for'), jsOf('vai_na_frente_faz_trem'), jsOf('sobrou'), jsOf('trem')]).toEqual(['else if', 'async function', '%', 'let']);
  });
});

describe('jsReserved', () => {
  const find = (name: string) => JS_RESERVED.find((entry) => entry.name === name);
  it('cobre as palavras e globais da §4.4', () => {
    expect(MUST_BE_RESERVED.filter((name) => find(name) === undefined)).toEqual([]);
  });
  it('classifica por categoria e equivalente', () => {
    expect(find('const')).toMatchObject({ kind: 'keyword', hasEquivalent: true, suggestion: 'uai' });
    expect(find('public')).toMatchObject({ kind: 'strict-reserved', hasEquivalent: false, suggestion: 'publico' });
    expect(find('console')).toMatchObject({ kind: 'global', hasEquivalent: true, suggestion: 'prosa' });
    expect(['arguments', 'eval', 'NaN', 'Infinity'].map((name) => find(name)?.kind)).toEqual(Array(4).fill('non-bindable'));
  });
  it('aponta os nomes goianos aprovados na RFC-0001 para as globais do JS', () => {
    expect(['Promise', 'setTimeout', 'clearInterval', 'JSON'].map((name) => find(name)?.suggestion)).toEqual(['Promessa', 'daqui_um_cadim', 'larga_mão', 'Coisa']);
  });
});

describe('retiredWords', () => {
  it('traz as 14 palavras aposentadas da §4.2 com destino quando há', () => {
    expect(RETIRED_WORDS).toHaveLength(EXPECTED_RETIRED_COUNT);
    const replacementOf = (word: string) => RETIRED_WORDS.find((entry) => entry.word === word)?.replacement;
    expect([replacementOf('presta_serviço'), replacementOf('vixe_que'), replacementOf('um_tanto_de')]).toEqual(['faz_trem', 'vixe', undefined]);
  });
});

describe('stdlib', () => {
  const names = (predicate: (entry: (typeof STDLIB)[number]) => boolean) => STDLIB.filter(predicate).map((entry) => entry.name).sort();
  it('marca como "owner" exatamente os nomes ✅ da §4.9', () => {
    expect(names((entry) => entry.origin === 'owner')).toEqual([...OWNER_NAMES].sort());
  });
  it('marca como didática exatamente as entradas da RFC-0001', () => {
    expect(names((entry) => entry.semantics === 'didactic')).toEqual([...DIDACTIC_NAMES].sort());
  });
  it('só entrada didática é ajudante, com helperName ASCII e único', () => {
    const helpers = STDLIB.filter((entry) => entry.kind === 'helper');
    expect(helpers.every((entry) => entry.semantics === 'didactic' && /^[a-z_]+$/u.test(entry.helperName ?? ''))).toBe(true);
    expect(new Set(helpers.map((entry) => entry.helperName)).size).toBe(helpers.length);
  });
  it('exige form fora dos globais e aridade coerente', () => {
    expect(STDLIB.filter((entry) => entry.receiver !== 'global' && entry.form === undefined)).toEqual([]);
    expect(STDLIB.filter((entry) => entry.arity.max !== undefined && entry.arity.max < entry.arity.min)).toEqual([]);
  });
  it('propriedades de instância trazem alternativas para o GS0601', () => {
    const properties = STDLIB.filter((entry) => entry.form === 'property' && entry.receiver !== 'namespace');
    expect(properties.map((entry) => entry.name).sort()).toEqual(['mensagem', 'o_tanto']);
    expect(properties.every((entry) => (entry.alternatives?.length ?? 0) > 0)).toBe(true);
  });
  it('registra variante sem acento explícita em todo nome acentuado', () => {
    const accented = STDLIB.filter((entry) => /[^\p{ASCII}]/u.test(entry.name));
    expect(accented.every((entry) => entry.asciiName !== undefined && /^\p{ASCII}+$/u.test(entry.asciiName))).toBe(true);
    expect(STDLIB.find((entry) => entry.name === 'começa_com')?.asciiName).toBe('comeca_com');
  });
  it('usa os nomes renomeados pela RFC-0001', () => {
    const present = ['ranca_a_cabeça', 'ranca_do_meio', 'ranca_os_espaço', 'cata', 'ajunta', 'naco', 'todin', 'tem_algum', 'onde_tá_o', 'Conta.ranca_o_sinal', 'Conta.elevado_a', 'Promessa.tudim_junto', 'Data.agorinha', 'Coisa.vira_texto', 'Coisa.vira_coisa', 'quando_der_bão'];
    const absent = ['arranca_o_rabo', 'tamanho', 'caça', 'juntar', 'pedaço', 'Conta.sem_sinal', 'Conta.elevado', 'promessa', 'quando_resolver', 'se_der_pobrema', 'daqui_a_pouco', 'deixa_pra_lá'];
    const all = new Set(STDLIB.map((entry) => entry.name));
    expect(present.filter((name) => !all.has(name))).toEqual([]);
    expect(absent.filter((name) => all.has(name))).toEqual([]);
  });
});

describe('jsMembers', () => {
  const has = (name: string) => (JS_MEMBER_NAMES as readonly string[]).includes(name);
  it('inclui membros nativos até o ES2023', () => {
    expect(['map', 'some', 'toSorted', 'toString', 'constructor', 'prototype', 'hasOwnProperty', 'at', 'flat', 'padStart', '__proto__'].filter((name) => !has(name))).toEqual([]);
  });
  it('não inclui o que é de ES posterior nem vem do motor (Promise.try, RegExp.escape)', () => {
    expect(['try', 'escape'].filter(has)).toEqual([]);
  });
  it('está ordenado e sem duplicatas', () => {
    expect([...new Set(JS_MEMBER_NAMES)].sort()).toEqual([...JS_MEMBER_NAMES]);
  });
});

describe('integridade entre tabelas (§8.2)', () => {
  const isInstanceMember = (entry: (typeof STDLIB)[number]) => entry.receiver !== 'global' && entry.receiver !== 'namespace';
  const spellings = [
    ...KEYWORDS.flatMap((entry) => [entry.spelling, entry.asciiSpelling]),
    ...JS_RESERVED.map((entry) => entry.name),
    ...STDLIB.filter((entry) => !(isInstanceMember(entry) && MEMBER_NAMES_SHARED_WITH_KEYWORDS.includes(entry.name))).flatMap((entry) => [entry.name, entry.asciiName]),
  ].filter((spelling): spelling is string => spelling !== undefined);
  it('nenhuma grafia aparece em mais de uma entrada', () => {
    const duplicated = spellings.filter((spelling, index) => spellings.indexOf(spelling) !== index);
    expect(duplicated).toEqual([]);
  });
  it('só o membro de promessa repete a grafia de uma keyword', () => {
    const keywordSpellings = new Set(KEYWORDS.flatMap((entry) => (entry.asciiSpelling === undefined ? [entry.spelling] : [entry.spelling, entry.asciiSpelling])));
    const shared = STDLIB.filter((entry) => keywordSpellings.has(entry.name) || keywordSpellings.has(entry.asciiName ?? entry.name));
    expect(shared.map((entry) => [entry.name, entry.receiver])).toEqual([['se_der_ruim', 'promise']]);
  });
  it('palavra aposentada nunca é reservada nem da biblioteca', () => {
    const reserved = new Set(spellings);
    expect(RETIRED_WORDS.filter((entry) => reserved.has(entry.word)).map((entry) => entry.word)).toEqual([]);
  });
  it('fixa o limite de aninhamento em 200', () => {
    expect(LIMITS.maxNestingDepth).toBe(200);
  });
});

const CODE_RANGES: readonly (readonly [string, number, number])[] = [
  ['GS01', 1, 7], ['GS02', 1, 9], ['GS03', 1, 12], ['GS04', 1, 6], ['GS05', 0, 23], ['GS06', 1, 4],
  ['GS07', 1, 3], ['GS07', 10, 14], ['GS08', 1, 7], ['GS08', 9, 9], ['GS09', 1, 5],
];
const EXPECTED_CODES = CODE_RANGES.flatMap(([prefix, first, last]) =>
  Array.from({ length: last - first + 1 }, (_, index) => `${prefix}${String(first + index).padStart(2, '0')}`));
const EXAMPLE_OPTIONAL = /^GS(07(1[1-4])|09)/u;
const EXPECTED_WARNING_COUNT = 9;
const markers = (text: string) => [...text.matchAll(/\{(\w+)\}/gu)].map((match) => match[1]).sort();

describe('catálogo de diagnósticos', () => {
  it('tem exatamente os códigos da §4.11 e da numeração fixada, sem o GS0808 recusado na RFC-0001', () => {
    expect(DIAGNOSTICS.map((entry) => entry.code).sort()).toEqual([...EXPECTED_CODES].sort());
  });
  it('traz os dois tons (marcadores do neutro contidos nos do raiz) e exemplo (exceto genéricos de execução e ferramentas)', () => {
    expect(DIAGNOSTICS.filter((entry) => entry.messages.raiz === '' || entry.messages.neutro === '')).toEqual([]);
    expect(DIAGNOSTICS.filter((entry) => !markers(entry.messages.neutro).every((marker) => markers(entry.messages.raiz).includes(marker))).map((entry) => entry.code)).toEqual([]);
    expect(DIAGNOSTICS.filter((entry) => entry.example === '' && !EXAMPLE_OPTIONAL.test(entry.code)).map((entry) => entry.code)).toEqual([]);
  });
  it('é aviso só na faixa GS08xx e no GS0904', () => {
    const warnings = DIAGNOSTICS.filter((entry) => entry.severity === 'warning').map((entry) => entry.code);
    expect(warnings.every((code) => code.startsWith('GS08') || code === 'GS0904')).toBe(true);
    expect(warnings).toHaveLength(EXPECTED_WARNING_COUNT);
  });
});
