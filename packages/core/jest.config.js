module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Diretórios de testes
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
  ],
  
  // Arquivos de setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!**/node_modules/**',
  ],
  
  // Thresholds de coverage
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Transformações
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Reporter verboso para desenvolvimento
  verbose: true,
};