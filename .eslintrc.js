module.exports = {
  env: {
    browser: false,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Regras de qualidade de código
    'no-console': 'warn',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-var': 'error',
    'prefer-const': 'error',

    // Estilo de código
    indent: ['error', 2],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'comma-dangle': ['error', 'always-multiline'],

    // Melhores práticas
    eqeqeq: 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',

    // Específico para o projeto GoiásScript — downgrade pra warn em
    // regras estilísticas que não bloqueiam funcionalidade. Voltam pra
    // error na Fase 1 quando o código for limpo de forma incremental.
    'max-len': ['warn', { code: 100, ignoreComments: true }],
    'no-useless-escape': 'warn',
    complexity: ['warn', 10],
  },
  overrides: [
    {
      // Regras específicas para testes
      files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
      rules: {
        'no-console': 'off',
      },
    },
  ],
};
