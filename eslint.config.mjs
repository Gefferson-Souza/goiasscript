import js from '@eslint/js';
import eslintComments from '@eslint-community/eslint-plugin-eslint-comments';
import nextPlugin from '@next/eslint-plugin-next';
import functional from 'eslint-plugin-functional';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const MAX_FILE_LINES = 800;
const MAX_FUNCTION_LINES = 50;
const MAX_DEPTH = 4;
const MAGIC_NUMBERS_ALLOWED = [-1, 0, 1, 2];
const MIN_DIRECTIVE_DESCRIPTION = 6;
const MUTABLE_STATE_GLOBS = ['packages/compiler/src/lexer/**/*.ts', 'packages/compiler/src/parser/**/*.ts', 'packages/compiler/src/analyzer/**/*.ts'];
const APP_FILES = ['apps/playground/**/*.{ts,tsx}', 'apps/playground-e2e/**/*.ts'];
const APP_REACT_FILES = ['apps/playground/**/*.tsx'];
const TS_FILES = ['packages/**/*.ts', 'tools/**/*.ts', 'scripts/**/*.ts', '*.config.mts', ...APP_FILES];
// Arquivos ainda fora do ESLint estrito: cada um sai desta lista quando é reescrito.
const LEGACY_APP_FILES = [
  'apps/playground/app/*.{ts,tsx}',
  'apps/playground/app/doacao/**',
  'apps/playground/components/**',
  'apps/playground/workers/**',
  'apps/playground/types/**',
  'apps/playground/tailwind.config.ts',
  'apps/playground/scripts/copy-examples.mjs',
  'apps/playground/lib/monaco-goias.ts',
  'apps/playground/lib/share.ts',
  'apps/playground/lib/use-runner.ts',
  'apps/playground-e2e/tests/{examples,security}.spec.ts',
];
const NOT_YET_COVERED_APPS = ['apps/engoianador-api/**'];
const RUNNER_FILES = ['apps/playground/sandbox/runner.ts'];
const TEST_FILES = ['**/*.test.ts', '**/tests/**/*.ts'];

const CLI_SRC_FILES = ['packages/cli/src/**/*.ts'];
const CLI_ENTRY_FILES = ['packages/cli/src/entry/**/*.ts'];
const PROCESS_MESSAGE = 'O processo só aparece em src/entry; o resto recebe E/S injetada.';

const typeDeclarationSelectors = [
  { selector: 'ExportNamedDeclaration > TSInterfaceDeclaration', message: 'Interface exportada vive em arquivo *.types.ts.' },
  { selector: 'ExportNamedDeclaration > TSTypeAliasDeclaration', message: 'Tipo exportado vive em arquivo *.types.ts.' },
];
const swallowedCatchSelector = {
  selector: "CatchClause > BlockStatement:not(:has(ThrowStatement, ReturnStatement, CallExpression[callee.object.name='process'][callee.property.name='exit']))",
  message: 'catch precisa relançar, retornar ou encerrar o processo; nunca engolir o erro.',
};

export function createConfig(projectService = true) {
  return tseslint.config(
    { ignores: ['**/node_modules/**', '**/coverage/**', '**/dist/**', '**/generated/**', 'packages/core/**', 'vscode-extension/**', 'lsp-server/**', ...NOT_YET_COVERED_APPS, ...LEGACY_APP_FILES, 'apps/playground/public/**', 'apps/playground/.next/**', 'apps/*/.next-configured/**', 'apps/playground/next-env.d.ts', 'docs/**', 'spikes/**', 'packages/compiler/tests/conformance/**'] },
    { linterOptions: { reportUnusedDisableDirectives: 'error' } },
    {
      files: TS_FILES,
      extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
      languageOptions: { parserOptions: { projectService, tsconfigRootDir: import.meta.dirname } },
      plugins: { '@eslint-community/eslint-comments': eslintComments, functional },
      rules: {
        '@typescript-eslint/ban-ts-comment': ['error', { 'ts-ignore': true, 'ts-nocheck': true, 'ts-expect-error': 'allow-with-description', minimumDescriptionLength: MIN_DIRECTIVE_DESCRIPTION }],
        '@eslint-community/eslint-comments/require-description': 'error',
        'no-magic-numbers': 'off',
        '@typescript-eslint/no-magic-numbers': ['error', { ignore: MAGIC_NUMBERS_ALLOWED, ignoreArrayIndexes: true, detectObjects: true, ignoreEnums: true, ignoreNumericLiteralTypes: true, ignoreTypeIndexes: true, ignoreReadonlyClassProperties: true }],
        'no-param-reassign': ['error', { props: true }],
        'prefer-const': 'error',
        'no-var': 'error',
        'functional/immutable-data': 'error',
        'no-empty': ['error', { allowEmptyCatch: false }],
        'no-restricted-syntax': ['error', ...typeDeclarationSelectors, swallowedCatchSelector],
        'max-lines': ['error', { max: MAX_FILE_LINES, skipBlankLines: false, skipComments: false }],
        'max-lines-per-function': ['error', { max: MAX_FUNCTION_LINES, skipBlankLines: false, skipComments: false, IIFEs: true }],
        'max-depth': ['error', MAX_DEPTH],
        'no-console': 'error',
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'default', format: ['camelCase'] },
          { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE'] },
          { selector: 'typeLike', format: ['PascalCase'] },
          { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
          { selector: ['property', 'objectLiteralProperty', 'typeProperty'], format: null },
          { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        ],
      },
    },
    { files: MUTABLE_STATE_GLOBS, rules: { 'functional/immutable-data': ['error', { ignoreAccessorPattern: 'this.**' }] } },
    {
      files: CLI_SRC_FILES,
      rules: {
        'no-restricted-globals': ['error', { name: 'process', message: PROCESS_MESSAGE }],
        'no-restricted-imports': ['error', { paths: [{ name: 'node:process', message: PROCESS_MESSAGE }, { name: 'process', message: PROCESS_MESSAGE }] }],
      },
    },
    {
      files: CLI_ENTRY_FILES,
      rules: {
        'no-restricted-globals': 'off',
        'functional/immutable-data': ['error', { ignoreAccessorPattern: 'process.**' }],
      },
    },
    { files: ['apps/playground/scripts/check-public-config.ts', 'apps/playground/scripts/run-smoke-playground.ts'], rules: { 'functional/immutable-data': ['error', { ignoreAccessorPattern: 'process.**' }] } },
    {
      files: APP_REACT_FILES,
      plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin },
      rules: {
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'error',
        ...nextPlugin.configs['core-web-vitals'].rules,
        '@typescript-eslint/naming-convention': [
          'error',
          { selector: 'function', format: ['camelCase', 'PascalCase'] },
          { selector: 'variable', modifiers: ['const'], format: ['camelCase', 'UPPER_CASE', 'PascalCase'] },
          { selector: 'typeLike', format: ['PascalCase'] },
          { selector: ['property', 'objectLiteralProperty', 'typeProperty'], format: null },
          { selector: 'parameter', format: ['camelCase'], leadingUnderscore: 'allow' },
        ],
      },
    },
    { files: RUNNER_FILES, rules: { 'no-console': 'off' } },
    { files: ['packages/cli/src/repl/timer-registry.ts', 'packages/cli/src/repl/line-drain.ts', 'packages/cli/src/run/program-runner.ts'], rules: { 'functional/immutable-data': 'off' } },
    { files: ['**/*.types.ts'], rules: { 'no-restricted-syntax': ['error', swallowedCatchSelector] } },
    { files: TEST_FILES, rules: { 'max-lines-per-function': 'off', 'no-magic-numbers': 'off', '@typescript-eslint/no-magic-numbers': 'off', 'functional/immutable-data': 'off' } },
    {
      files: ['**/*.mjs', '**/*.cjs'],
      extends: [js.configs.recommended, tseslint.configs.disableTypeChecked],
      languageOptions: { sourceType: 'module', globals: { process: 'readonly', URL: 'readonly', module: 'writable' } },
    },
  );
}

export default createConfig();
