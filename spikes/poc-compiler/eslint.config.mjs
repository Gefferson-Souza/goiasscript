import functional from 'eslint-plugin-functional';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { files: ['**/*.ts'], languageOptions: { parser: tseslint.parser, parserOptions: { projectService: true } } },
  {
    files: ['**/*.ts'],
    plugins: { functional },
    rules: {
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-depth': ['warn', 4],
      'functional/immutable-data': 'warn',
    },
  },
  { files: ['src/lexer.ts', 'src/parser.ts'], rules: { 'functional/immutable-data': ['warn', { ignoreAccessorPattern: ['this.**'] }] } },
);
