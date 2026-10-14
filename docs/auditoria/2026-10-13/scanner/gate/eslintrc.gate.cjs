// Regras estritas do dono em formato eslintrc (ESLint 8.x). Equivalentes às regras R01-R20 do scanner.
// Dependências de desenvolvimento: @typescript-eslint/parser, @typescript-eslint/eslint-plugin,
// @eslint-community/eslint-plugin-eslint-comments.
// Severidade: "error" bloqueia; "warn" só anota (usar --max-warnings=<baseline> para travar o total).
const resolveFrom = (name) =>
  require.resolve(name, { paths: [process.env.GATE_RESOLVE_FROM ?? process.cwd(), __dirname] });

const DIACRITICS = 'áàâãäéèêëíìîïóòôõöúùûüçñÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇÑ';
const NO_CATCH_EXIT =
  "CatchClause > BlockStatement:not(:has(ThrowStatement, ReturnStatement, CallExpression[callee.object.name='process'][callee.property.name='exit']))";
const MAGIC_NUMBER_OPTIONS = { ignore: [-1, 0, 1, 2], ignoreArrayIndexes: true, detectObjects: true, enforceConst: false };

module.exports = {
  root: true,
  env: { es2022: true, node: true, browser: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  plugins: ['@eslint-community/eslint-comments'],
  rules: {
    'max-lines': ['warn', { max: 400, skipBlankLines: false, skipComments: false }],
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: false, skipComments: false, IIFEs: true }],
    'max-depth': ['error', 4],
    'no-console': 'error',
    '@eslint-community/eslint-comments/require-description': 'error',
    'no-warning-comments': ['error', { terms: ['todo', 'fixme', 'hack', 'xxx'], location: 'start' }],
    'no-inline-comments': 'error',
    'id-match': ['error', `^[^${DIACRITICS}]*$`, { properties: true, classFields: true, onlyDeclarations: true }],
    'no-magic-numbers': ['warn', MAGIC_NUMBER_OPTIONS],
    'no-param-reassign': ['warn', { props: true, ignorePropertyModificationsFor: ['config', 'context', 'acc', 'accumulator'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'no-empty': 'error',
    'no-restricted-syntax': ['warn', { selector: NO_CATCH_EXIT, message: 'catch sem throw/return/process.exit' }],
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      parser: resolveFrom('@typescript-eslint/parser'),
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/ban-ts-comment': [
          'error',
          { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: 6 },
        ],
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': ['warn', MAGIC_NUMBER_OPTIONS],
      },
    },
    {
      files: ['**/tests/**', '**/test/**', '**/*.test.*', '**/*.spec.*'],
      rules: {
        'no-console': 'off',
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
        'max-lines-per-function': 'off',
      },
    },
    {
      files: ['packages/core/bin/**', 'packages/core/src/cli/**', 'apps/playground/scripts/**'],
      rules: { 'no-console': 'warn' },
    },
    {
      // Tabela de keywords da linguagem: as chaves acentuadas (ocê, é_igualim...) são superfície, não identificador interno.
      files: ['packages/core/src/compiler/lexer.js'],
      rules: { 'id-match': 'off' },
    },
  ],
};
