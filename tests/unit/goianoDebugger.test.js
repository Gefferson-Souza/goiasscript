const GoianoDebugger = require('../../src/debug/GoianoDebugger');
const fs = require('fs');

// Mock filesystem and process
jest.mock('fs');
jest.mock('readline');

describe('GoianoDebugger', () => {
  let goianoDebugger;

  beforeEach(() => {
    goianoDebugger = new GoianoDebugger();
    jest.clearAllMocks();
  });

  describe('Breakpoint Management', () => {
    test('deve adicionar breakpoint', () => {
      goianoDebugger.addBreakpoint('test.gs', 10);

      expect(goianoDebugger.breakpoints.has('test.gs')).toBe(true);
      expect(goianoDebugger.breakpoints.get('test.gs')).toContain(10);
    });

    test('deve remover breakpoint', () => {
      goianoDebugger.addBreakpoint('test.gs', 10);
      goianoDebugger.removeBreakpoint('test.gs', 10);

      expect(goianoDebugger.breakpoints.get('test.gs')).not.toContain(10);
    });

    test('deve listar breakpoints', () => {
      goianoDebugger.addBreakpoint('test.gs', 10);
      goianoDebugger.addBreakpoint('test.gs', 20);

      const spy = jest.spyOn(console, 'log').mockImplementation();
      goianoDebugger.listBreakpoints();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    test('deve verificar se linha tem breakpoint', () => {
      goianoDebugger.addBreakpoint('test.gs', 10);

      expect(goianoDebugger.hasBreakpoint('test.gs', 10)).toBe(true);
      expect(goianoDebugger.hasBreakpoint('test.gs', 15)).toBe(false);
    });
  });

  describe('Watch Variables', () => {
    test('deve adicionar variável para monitoramento', () => {
      goianoDebugger.watch('nome');

      expect(goianoDebugger.watchlist).toContain('nome');
    });

    test('deve remover variável do monitoramento', () => {
      goianoDebugger.watch('nome');
      goianoDebugger.unwatch('nome');

      expect(goianoDebugger.watchlist).not.toContain('nome');
    });

    test('deve listar variáveis monitoradas', () => {
      goianoDebugger.watch('nome');
      goianoDebugger.watch('idade');

      const spy = jest.spyOn(console, 'log').mockImplementation();
      goianoDebugger.listWatchlist();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Debug Session', () => {
    test('deve inicializar sessão de debug', () => {
      const mockCode = 'uai nome é "João";';
      
      fs.readFileSync.mockReturnValue(mockCode);
      fs.existsSync.mockReturnValue(true);

      goianoDebugger.startDebugSession('test.gs');

      expect(goianoDebugger.currentFile).toBe('test.gs');
      expect(goianoDebugger.isDebugging).toBe(true);
    });

    test('deve falhar ao debugar arquivo inexistente', () => {
      fs.existsSync.mockReturnValue(false);

      expect(() => {
        goianoDebugger.startDebugSession('inexistente.gs');
      }).toThrow('Arquivo não encontrado');
    });

    test('deve parar sessão de debug', () => {
      goianoDebugger.startDebugSession = jest.fn(); // Mock to avoid file system
      goianoDebugger.isDebugging = true;
      goianoDebugger.currentFile = 'test.gs';

      goianoDebugger.stopDebugSession();

      expect(goianoDebugger.isDebugging).toBe(false);
      expect(goianoDebugger.currentFile).toBeNull();
    });
  });

  describe('Step Execution', () => {
    test('deve executar próxima linha', () => {
      goianoDebugger.currentLine = 5;
      goianoDebugger.isDebugging = true;

      goianoDebugger.stepNext();

      expect(goianoDebugger.currentLine).toBe(6);
    });

    test('deve continuar execução', () => {
      goianoDebugger.isPaused = true;

      goianoDebugger.continue();

      expect(goianoDebugger.isPaused).toBe(false);
    });
  });

  describe('Variable Inspection', () => {
    test('deve obter valor de variável', () => {
      goianoDebugger.variables = new Map([['nome', 'João'], ['idade', 30]]);

      const valor = goianoDebugger.getVariableValue('nome');

      expect(valor).toBe('João');
    });

    test('deve retornar undefined para variável inexistente', () => {
      const valor = goianoDebugger.getVariableValue('inexistente');

      expect(valor).toBeUndefined();
    });

    test('deve mostrar todas as variáveis', () => {
      goianoDebugger.variables = new Map([['nome', 'João'], ['idade', 30]]);

      const spy = jest.spyOn(console, 'log').mockImplementation();
      goianoDebugger.showVariables();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Call Stack', () => {
    test('deve adicionar frame ao call stack', () => {
      goianoDebugger.pushCallFrame('minhaFuncao', 'test.gs', 15);

      expect(goianoDebugger.callStack).toHaveLength(1);
      expect(goianoDebugger.callStack[0].functionName).toBe('minhaFuncao');
    });

    test('deve remover frame do call stack', () => {
      goianoDebugger.pushCallFrame('minhaFuncao', 'test.gs', 15);
      goianoDebugger.popCallFrame();

      expect(goianoDebugger.callStack).toHaveLength(0);
    });

    test('deve mostrar call stack', () => {
      goianoDebugger.pushCallFrame('funcao1', 'test.gs', 10);
      goianoDebugger.pushCallFrame('funcao2', 'test.gs', 20);

      const spy = jest.spyOn(console, 'log').mockImplementation();
      goianoDebugger.showCallStack();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('Debug Configuration', () => {
    test('deve carregar configuração de debug', () => {
      const mockConfig = {
        breakpoints: { 'test.gs': [10, 20] },
        watchlist: ['nome', 'idade']
      };

      fs.readFileSync.mockReturnValue(JSON.stringify(mockConfig));
      fs.existsSync.mockReturnValue(true);

      goianoDebugger.loadDebugConfig('debug.json');

      expect(goianoDebugger.breakpoints.get('test.gs')).toEqual([10, 20]);
      expect(goianoDebugger.watchlist).toEqual(['nome', 'idade']);
    });

    test('deve salvar configuração de debug', () => {
      goianoDebugger.addBreakpoint('test.gs', 10);
      goianoDebugger.watch('nome');

      fs.writeFileSync = jest.fn();

      goianoDebugger.saveDebugConfig('debug.json');

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('Debug Report', () => {
    test('deve gerar relatório de debug', () => {
      goianoDebugger.addBreakpoint('test.gs', 10);
      goianoDebugger.watch('nome');
      goianoDebugger.variables = new Map([['nome', 'João']]);

      fs.writeFileSync = jest.fn();

      const report = goianoDebugger.generateDebugReport();

      expect(report).toBeDefined();
      expect(report.breakpoints).toBeDefined();
      expect(report.watchlist).toBeDefined();
      expect(report.variables).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('deve lidar com erro ao carregar configuração', () => {
      fs.existsSync.mockReturnValue(false);

      expect(() => {
        goianoDebugger.loadDebugConfig('inexistente.json');
      }).toThrow('Arquivo de configuração não encontrado');
    });

    test('deve lidar com JSON inválido na configuração', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('JSON inválido');

      expect(() => {
        goianoDebugger.loadDebugConfig('debug.json');
      }).toThrow();
    });
  });
});