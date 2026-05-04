/**
 * Configuração global para testes do GoiásScript
 * Este arquivo é executado antes de todos os testes
 */

// Configurar timeout global para testes
jest.setTimeout(10000);

// Mocks globais para console
global.console = {
  ...console,
  // Mock console.log nos testes para não poluir output
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};

// Helper para limpar mocks entre testes
afterEach(() => {
  jest.clearAllMocks();
});

// Helper para capturar output do console nos testes
global.captureConsoleOutput = () => {
  const originalLog = console.log;
  const logs = [];
  
  console.log = (...args) => {
    logs.push(args.join(' '));
    originalLog(...args);
  };
  
  return {
    getLogs: () => logs,
    restore: () => {
      console.log = originalLog;
    },
  };
};

// Utilitário para testar arquivos GoiásScript
global.testGoiasScript = (code) => {
  const GoiasScriptCompiler = require('../src/compiler');
  const compiler = new GoiasScriptCompiler();
  return compiler.compile(code);
};