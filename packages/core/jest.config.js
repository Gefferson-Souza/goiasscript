module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',

  // Diretórios de testes
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],

  // Arquivos de setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // Coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: ['src/**/*.js', '!src/**/*.test.js', '!**/node_modules/**'],

  // Thresholds de coverage — pragmáticos para o v1.5 enxuto.
  // Meta de 80% retorna na Fase 1 (W20) quando houver tests do playground +
  // novos tests cobrindo src/cli/index.js e src/compiler.js (gaps atuais).
  coverageThreshold: {
    global: {
      branches: 40,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },

  // Transformações
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/'],

  // Timeout para testes
  testTimeout: 10000,

  // Reporter verboso para desenvolvimento
  verbose: true,
};
