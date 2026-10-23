import type { KeywordCategory, StdlibReceiver } from '@goiasscript/language';

export const KEYWORD_CATEGORY_LABELS: Readonly<Record<KeywordCategory, string>> = {
  declaration: 'declaração',
  assignment: 'atribuição',
  function: 'função',
  control: 'controle de fluxo',
  class: 'classe',
  error: 'tratamento de erro',
  literal: 'valor literal',
  operator: 'operador',
};

export const RECEIVER_CATEGORY_LABELS: Readonly<Record<StdlibReceiver, string>> = {
  global: 'função da casa',
  namespace: 'biblioteca',
  text: 'texto',
  list: 'lista',
  textOrList: 'texto ou lista',
  number: 'número',
  object: 'coisa',
  promise: 'promessa',
  error: 'erro',
  date: 'data',
};

export const MARKDOWN_SPECIAL = /[\\`*_{}[\]()#+\-.!|<>~&]/gu;
export const BACKTICK = /`/gu;
