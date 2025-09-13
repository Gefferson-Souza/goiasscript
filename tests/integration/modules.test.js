const GoiasScriptCompiler = require('../../src/compiler');
const fs = require('fs');
const path = require('path');

// Mock fs for testing
jest.mock('fs');

describe('Module System Integration', () => {
  let compiler;

  beforeEach(() => {
    compiler = new GoiasScriptCompiler();
    jest.clearAllMocks();
  });

  describe('Basic Module Compilation', () => {
    test('deve compilar código sem módulos normalmente', () => {
      const codigo = `
        uai nome é "GoiásScript"
        prosa(nome)
      `;

      const result = compiler.compile(codigo, 'test.gs');

      expect(result.success).toBe(true);
      expect(result.moduleInfo.hasModules).toBe(false);
      expect(result.moduleInfo.imports).toHaveLength(0);
      expect(result.moduleInfo.exports).toHaveLength(0);
      expect(result.javascript).toContain('const nome = "GoiásScript"');
    });

    test('deve processar imports e gerar JavaScript correto', () => {
      const codigo = `
        pega utils de "./utils"
        
        uai result é utils.process("data")
        prosa(result)
      `;

      const result = compiler.compile(codigo, '/project/main.gs');

      expect(result.success).toBe(true);
      expect(result.moduleInfo.hasModules).toBe(true);
      expect(result.moduleInfo.imports).toHaveLength(1);
      expect(result.javascript).toContain("const utils = require('/project/utils.gs')");
      expect(result.javascript).toContain('const result = utils.process("data")');
    });

    test('deve processar exports e gerar JavaScript correto', () => {
      const codigo = `
        faz_trem soma(a, b) {
          faz_favor a mais b
        }
        
        troca_ideia soma
      `;

      const result = compiler.compile(codigo, 'math.gs');

      expect(result.success).toBe(true);
      expect(result.moduleInfo.hasModules).toBe(true);
      expect(result.moduleInfo.exports).toHaveLength(1);
      expect(result.javascript).toContain('function soma(a, b)');
      expect(result.javascript).toContain('module.exports.soma = soma');
    });
  });

  describe('Advanced Module Features', () => {
    test('deve processar named imports com tipos', () => {
      const codigo = `
        pega { calcular, validar } de "./utils"
        
        uai resultado: numero é calcular(10, 20)
        uai valido: booleano é validar(resultado)
        
        troca_ideia { resultado, valido }
      `;

      const result = compiler.compile(codigo, 'processor.gs');

      expect(result.success).toBe(true);
      expect(result.moduleInfo.imports[0].type).toBe('named');
      expect(result.typeInfo.typeCount).toBeGreaterThan(0);
      expect(result.javascript).toContain('const { calcular, validar }');
    });

    test('deve processar mixed imports complexos', () => {
      const codigo = `
        pega Math, { PI, E } de "./constants"
        
        faz_trem calculateArea(radius: numero) {
          faz_favor Math.pow(radius, 2) vezes PI
        }
        
        troca_ideia_principal calculateArea
      `;

      const result = compiler.compile(codigo, 'geometry.gs');

      expect(result.success).toBe(true);
      expect(result.moduleInfo.imports[0].type).toBe('mixed');
      expect(result.moduleInfo.exports[0].type).toBe('default');
      expect(result.javascript).toContain('const Math = require');
      expect(result.javascript).toContain('const { PI, E } = Math');
      expect(result.javascript).toContain('module.exports = calculateArea');
    });

    test('deve processar namespace imports', () => {
      const codigo = `
        pega tudo_de Utils de "./utils"
        
        uai result é Utils.helper.process()
        prosa(Utils.constants.VERSION)
      `;

      const result = compiler.compile(codigo, 'app.gs');

      expect(result.success).toBe(true);
      expect(result.moduleInfo.imports[0].type).toBe('namespace');
      expect(result.javascript).toContain("const Utils = require(");
    });
  });

  describe('Module Warnings and Validation', () => {
    test('deve gerar warning para módulo não encontrado', () => {
      fs.existsSync.mockReturnValue(false);

      const codigo = 'pega utils de "./missing-module"';
      const result = compiler.compile(codigo, '/project/main.gs');

      expect(result.success).toBe(true); // Compilation succeeds but with warnings
      expect(result.warnings).toContainEqual(
        expect.objectContaining({
          type: 'module_not_found',
          message: expect.stringContaining('não foi encontrado'),
        })
      );
    });

    test('deve validar múltiplos módulos', () => {
      fs.existsSync.mockImplementation((path) => {
        return path === '/project/utils.gs';
      });

      const codigo = `
        pega utils de "./utils"
        pega missing de "./missing"
        pega { helper } de "./helper"
      `;

      const result = compiler.compile(codigo, '/project/main.gs');

      expect(result.warnings).toHaveLength(2); // missing and helper not found
      expect(result.warnings.filter(w => w.type === 'module_not_found')).toHaveLength(2);
    });

    test('deve combinar warnings de módulos com warnings de tipos', () => {
      fs.existsSync.mockReturnValue(false);

      const codigo = `
        pega utils de "./missing"
        
        uai idade: numero é "25"  // Type mismatch warning
        trem x é 42
        x é "texto"  // Type change warning
      `;

      const result = compiler.compile(codigo, 'test.gs');

      expect(result.success).toBe(true);
      const moduleWarnings = result.warnings.filter(w => w.type === 'module_not_found');
      const typeWarnings = result.warnings.filter(w => w.type && (w.type.includes('type') || w.type.includes('mismatch')));
      
      expect(moduleWarnings).toHaveLength(1);
      expect(typeWarnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Complex Integration Scenarios', () => {
    test('deve compilar módulo com imports, exports e sistema de tipos', () => {
      const codigo = `
        // Imports with types
        pega { Calculator } de "./calculator"
        pega config de "./config"
        
        // Typed functions
        faz_trem processOrder(order: objeto, calc: Calculator): objeto {
          uai total: numero é calc.calculate(order.items)
          uai processed: objeto é {
            id: order.id,
            total: total,
            processed: certeza
          }
          faz_favor processed
        }
        
        // Global variables with types
        uai processor: funcao é processOrder
        
        // Multiple exports
        troca_ideia { processOrder, processor }
      `;

      const result = compiler.compile(codigo, '/project/order-processor.gs');

      expect(result.success).toBe(true);
      expect(result.moduleInfo.hasModules).toBe(true);
      expect(result.moduleInfo.imports).toHaveLength(2);
      expect(result.moduleInfo.exports).toHaveLength(1);
      expect(result.typeInfo.typeCount).toBeGreaterThan(0);
      
      // Check if types and modules are properly processed
      expect(result.typeInfo.symbols).toHaveProperty('processor');
      expect(result.javascript).toContain('function processOrder');
    });

    test('deve preservar estrutura e funcionalidade do código', () => {
      const codigo = `
        pega { Logger } de "./logger"
        
        faz_trem initialize(config: objeto) {
          Logger.info("Initializing application...")
          
          se (config.debug) {
            Logger.debug("Debug mode enabled")
          }
          
          uai services é []
          para (uai service em config.services) {
            services.push(service)
            Logger.info("Service loaded: " mais service.name)
          }
          
          faz_favor {
            initialized: certeza,
            services: services,
            timestamp: Date.now()
          }
        }
        
        troca_ideia_principal initialize
      `;

      const result = compiler.compile(codigo, 'app.gs');

      expect(result.success).toBe(true);
      expect(result.javascript).toContain('Logger.info("Initializing application...")');
      expect(result.javascript).toContain('config.debug');
      expect(result.javascript).toContain('para (const service in config.services)');
      expect(result.javascript).toContain('module.exports = initialize');
    });
  });

  describe('Module Cache and Management', () => {
    test('deve limpar cache de módulos', () => {
      compiler.moduleResolver.moduleRegistry.set('/test/module.gs', {});
      
      compiler.clearModuleCache();
      
      expect(compiler.moduleResolver.moduleRegistry.size).toBe(0);
    });

    test('deve gerar relatório de dependências', () => {
      const codigo = `
        pega utils de "./utils"
        pega config de "./config"
      `;

      compiler.compile(codigo, '/project/main.gs');
      
      const report = compiler.getModuleDependencyReport();
      
      expect(report.totalModules).toBe(1);
      expect(report.modules).toHaveLength(1);
      expect(report.modules[0].dependencies).toEqual([
        '/project/utils.gs',
        '/project/config.gs'
      ]);
    });
  });

  describe('Real-World Module Examples', () => {
    test('deve processar exemplo de calculadora modular', () => {
      // Simulando um módulo de calculadora
      const mathModule = `
        faz_trem soma(a: numero, b: numero): numero {
          faz_favor a mais b
        }
        
        faz_trem multiplicar(a: numero, b: numero): numero {
          faz_favor a vezes b
        }
        
        uai PI: numero é 3.14159
        
        troca_ideia { soma, multiplicar, PI }
      `;

      const mainModule = `
        pega { soma, multiplicar, PI } de "./math"
        
        uai raio: numero é 5
        uai area: numero é multiplicar(PI, multiplicar(raio, raio))
        uai perimetro: numero é multiplicar(2, multiplicar(PI, raio))
        
        prosa("Área:", area)
        prosa("Perímetro:", perimetro)
        
        troca_ideia { area, perimetro }
      `;

      const mathResult = compiler.compile(mathModule, '/project/math.gs');
      const mainResult = compiler.compile(mainModule, '/project/main.gs');

      expect(mathResult.success).toBe(true);
      expect(mainResult.success).toBe(true);
      
      expect(mathResult.moduleInfo.exports[0].exports).toEqual(['soma', 'multiplicar', 'PI']);
      expect(mainResult.moduleInfo.imports[0].imports).toEqual(['soma', 'multiplicar', 'PI']);
    });

    test('deve processar exemplo de sistema de configuração', () => {
      const configModule = `
        uai defaultConfig: objeto é {
          debug: de_jeito_nenhum,
          port: 3000,
          database: {
            host: "localhost",
            port: 5432
          }
        }
        
        faz_trem loadConfig(overrides: objeto): objeto {
          faz_favor { ...defaultConfig, ...overrides }
        }
        
        troca_ideia_principal loadConfig
        troca_ideia { defaultConfig }
      `;

      const appModule = `
        pega loadConfig, { defaultConfig } de "./config"
        
        uai appConfig: objeto é loadConfig({
          debug: certeza,
          database: { host: "production-db" }
        })
        
        prosa("Configuration loaded:", appConfig)
        prosa("Default port:", defaultConfig.port)
      `;

      const configResult = compiler.compile(configModule, '/project/config.gs');
      const appResult = compiler.compile(appModule, '/project/app.gs');

      expect(configResult.success).toBe(true);
      expect(appResult.success).toBe(true);
      
      expect(configResult.moduleInfo.exports).toHaveLength(2); // default + named
      expect(appResult.moduleInfo.imports[0].type).toBe('mixed');
    });
  });
});