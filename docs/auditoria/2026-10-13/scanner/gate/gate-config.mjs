// Regras ESLint equivalentes às regras do scanner, na forma proposta para o gate de CI.
// Cada entrada diz a qual regra do scanner (Rxx) a regra ESLint corresponde.

const DIACRITIC_CLASS = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';

export const GATE_RULES = {
  R01: { eslint: 'max-lines', options: [{ max: 400, skipBlankLines: false, skipComments: false }], scope: 'all' },
  R02: { eslint: 'max-lines', options: [{ max: 800, skipBlankLines: false, skipComments: false }], scope: 'all' },
  R03: {
    eslint: 'max-lines-per-function',
    options: [{ max: 50, skipBlankLines: false, skipComments: false, IIFEs: true }],
    scope: 'all',
  },
  R04: { eslint: 'max-depth', options: [4], scope: 'all' },
  R06: { eslint: 'no-console', options: [], scope: 'non-test' },
  R07: { eslint: '@typescript-eslint/no-explicit-any', options: [], scope: 'ts' },
  R08: {
    eslint: '@typescript-eslint/ban-ts-comment',
    options: [{ 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 6 }],
    scope: 'ts',
  },
  R09: { eslint: '@eslint-community/eslint-comments/require-description', options: [], scope: 'all' },
  R10: { eslint: 'no-warning-comments', options: [{ terms: ['todo', 'fixme', 'hack', 'xxx'], location: 'start' }], scope: 'all' },
  R12: { eslint: 'no-inline-comments', options: [], scope: 'all' },
  R14d: {
    eslint: 'id-match',
    options: [`^[^${DIACRITIC_CLASS}]*$`, { properties: true, classFields: true, onlyDeclarations: true }],
    scope: 'all',
  },
  R15: {
    eslint: 'no-magic-numbers',
    options: [{ ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true, detectObjects: true, enforceConst: false }],
    scope: 'non-test',
  },
  R17: { eslint: 'no-param-reassign', options: [{ props: false }], scope: 'all' },
  R18: { eslint: 'no-param-reassign', options: [{ props: true }], scope: 'all', variant: 'props' },
  R19a: { eslint: 'prefer-const', options: [], scope: 'all' },
  R19b: { eslint: 'no-var', options: [], scope: 'all' },
  R20: { eslint: 'no-empty', options: [{ allowEmptyCatch: false }], scope: 'all' },
  R20s: {
    eslint: 'no-restricted-syntax',
    options: [
      {
        selector:
          "CatchClause > BlockStatement:not(:has(ThrowStatement, ReturnStatement, CallExpression[callee.object.name='process'][callee.property.name='exit']))",
        message: 'catch sem throw/return/exit',
      },
    ],
    scope: 'all',
  },
};

export const TS_RULE_NAMES = ['no-explicit-any', 'ban-ts-comment', 'no-magic-numbers'];

export function appliesTo(scope, file) {
  if (scope === 'all') return true;
  if (scope === 'non-test') return file.role !== 'test';
  if (scope === 'ts') return ['.ts', '.tsx'].includes(file.ext);
  return false;
}
