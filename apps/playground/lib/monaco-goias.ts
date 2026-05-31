// Definição da linguagem GoiásScript para o Monaco Editor.
// Tokens portados de vscode-extension/syntaxes/goiasscript.tmLanguage.json,
// adaptados para o formato Monarch.
import type { Monaco } from '@monaco-editor/react';

export const GOIAS_LANGUAGE_ID = 'goiasscript';

export const goiasMonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.gs',

  keywords: [
    'se',
    'se_ocê_quiser',
    'se_num_for',
    'se_não',
    'senao',
    'vai_indo',
    'enquanto_tiver',
    'para_com_isso',
    'continua_aí',
    'faz_favor',
    'tenta_aí',
    'se_der_ruim',
    'por_fim',
    'pega',
    'troca_ideia',
    'troca_ideia_principal',
    'em',
    'de',
    'pra',
    'tudo_de',
  ],

  storage: [
    'uai',
    'trem',
    'vazio',
    'sei_lá',
    'arruma_trem',
    'inherda_de',
    'vai_na_frente',
    'espera_um_cadim',
    'faz_um',
    'num_muda',
    'aprepara_trem',
    'ninguem_fuça',
    'só_da_famia',
    'todo_mundo_vê',
    'fixo',
    'faz_trem',
  ],

  constants: ['certeza', 'de_jeito_nenhum', 'nada', 'indefinido', 'ocê'],

  types: ['texto', 'numero', 'booleano', 'lista', 'objeto', 'funcao', 'coisa'],

  operators: [
    'é',
    'mais',
    'menos',
    'vezes',
    'dividido',
    'sobrou',
    'tem',
    'é_igualim',
    'diferente',
    'maior_que',
    'menor_que',
    'pelo_menos',
    'no_máximo',
    'é_tipo_de',
    'e_mais',
    'ou_então',
    'num_é',
    'num',
  ],

  builtins: [
    'prosa',
    'prosa_erro',
    'prosa_aviso',
    'reclama',
    'vixe',
    'GoianoMath',
    'vira_numero',
    'vira_decimal',
    'depois_de',
    'repetir_a_cada',
    'cancelar_depois',
    'cancelar_repeticao',
  ],

  symbols: /[=><!~?:&|+\-*/^%]+/,

  tokenizer: {
    root: [
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      [/"([^"\\]|\\.)*"/, 'string'],
      [/'([^'\\]|\\.)*'/, 'string'],

      [
        /@?[\p{L}_$][\p{L}\p{N}_$]*/u,
        {
          cases: {
            '@keywords': 'keyword',
            '@storage': 'keyword.storage',
            '@constants': 'constant',
            '@types': 'type',
            '@operators': 'keyword.operator',
            '@builtins': 'support.function',
            '@default': 'identifier',
          },
        },
      ],

      [/\b\d+\.\d+\b/, 'number.float'],
      [/\b\d+\b/, 'number'],

      [/[{}()[\]]/, '@brackets'],
      [/[<>](?!@symbols)/, '@brackets'],
      [/@symbols/, 'operator'],
      [/[;,.]/, 'delimiter'],
    ],

    comment: [
      [/[^/*]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[/*]/, 'comment'],
    ],
  },
};

export const goiasLanguageConfig = {
  comments: { lineComment: '//', blockComment: ['/*', '*/'] as [string, string] },
  brackets: [
    ['{', '}'],
    ['[', ']'],
    ['(', ')'],
  ] as [string, string][],
  autoClosingPairs: [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
  ],
};

export const goiasDarkTheme = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [
    { token: 'keyword', foreground: 'f5c518', fontStyle: 'bold' },
    { token: 'keyword.storage', foreground: '79c0ff', fontStyle: 'bold' },
    { token: 'keyword.operator', foreground: 'ff7b72' },
    { token: 'constant', foreground: 'ffa657' },
    { token: 'type', foreground: '7ee787' },
    { token: 'support.function', foreground: 'd2a8ff' },
    { token: 'string', foreground: 'a5d6ff' },
    { token: 'comment', foreground: '8b949e', fontStyle: 'italic' },
    { token: 'number', foreground: 'f0883e' },
  ],
  colors: {
    'editor.background': '#0d1117',
    'editor.foreground': '#e6edf3',
    'editorLineNumber.foreground': '#484f58',
    'editorLineNumber.activeForeground': '#f5c518',
    'editor.selectionBackground': '#f5c51844',
  },
};

let registered = false;

export function registerGoiasScript(monaco: Monaco) {
  if (registered) return;
  registered = true;
  monaco.languages.register({ id: GOIAS_LANGUAGE_ID, extensions: ['.gs'] });
  monaco.languages.setMonarchTokensProvider(GOIAS_LANGUAGE_ID, goiasMonarchLanguage as never);
  monaco.languages.setLanguageConfiguration(GOIAS_LANGUAGE_ID, goiasLanguageConfig);
  monaco.editor.defineTheme('goias-dark', goiasDarkTheme);
}
