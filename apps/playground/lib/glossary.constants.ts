export const GLOSSARY_ANCHOR_PREFIX = 'termo-';

export const GLOSSARY_TEXTS = {
  title: 'Glossário do goianês',
  intro: 'Todas as palavras da linguagem e da biblioteca, com o que cada uma vira em JavaScript.',
  keywordsTitle: 'Palavras da linguagem',
  libraryTitle: 'Biblioteca',
  lessonLink: 'Ver a lição',
  jsLabel: 'em JavaScript',
} as const;

export const KEYWORD_CATEGORY_LABELS: Readonly<Record<string, string>> = {
  declaration: 'declaração',
  assignment: 'atribuição',
  function: 'função',
  control: 'controle de fluxo',
  class: 'classe',
  error: 'tratamento de erro',
  literal: 'valor literal',
  operator: 'operador',
};
