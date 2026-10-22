import type { StdlibReceiver } from '@goiasscript/language';

export const GUARANTEED_DATA: ReadonlySet<string> = new Set(['Literal', 'ArrayExpression', 'ObjectExpression', 'NewExpression']);

export const RECEIVER_LABEL: Readonly<Record<StdlibReceiver, string>> = {
  global: 'biblioteca',
  text: 'texto',
  list: 'lista',
  textOrList: 'texto e de lista',
  number: 'número',
  object: 'coisa',
  promise: 'promessa',
  error: 'erro',
  date: 'data',
  namespace: 'biblioteca',
};

export const EXPECTED_FORM = {
  property: 'é propriedade e não leva parênteses',
  method: 'é método e precisa de parênteses',
} as const;

export const ARGUMENT_PLACEHOLDER = 'valor';
