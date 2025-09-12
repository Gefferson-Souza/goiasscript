const ModuleResolver = require('../../src/modules/ModuleResolver');
const fs = require('fs');
const path = require('path');

// Mock fs for testing
jest.mock('fs');

describe('ModuleResolver', () => {
  let resolver;

  beforeEach(() => {
    resolver = new ModuleResolver();
    jest.clearAllMocks();
  });

  describe('Basic Module Resolution', () => {
    test('deve processar código sem módulos', () => {
      const codigo = `
        uai nome é "GoiásScript"
        prosa(nome)
      `;

      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.hasModules).toBe(false);
      expect(result.imports).toHaveLength(0);
      expect(result.exports).toHaveLength(0);
      expect(result.dependencies).toHaveLength(0);
    });

    test('deve preservar código original quando não há módulos', () => {
      const codigo = `uai teste é 42\nprosa(teste)`;
      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.code.trim()).toBe(codigo);
    });
  });

  describe('Import Processing', () => {
    test('deve processar import default', () => {
      const codigo = 'pega utils de "./utils"';
      const result = resolver.resolveModules(codigo, '/project/main.gs');

      expect(result.hasModules).toBe(true);
      expect(result.imports).toHaveLength(1);
      expect(result.imports[0]).toMatchObject({
        type: 'default',
        importName: 'utils',
        originalPath: './utils',
        jsCode: "const utils = require('/project/utils.gs');",
      });
    });

    test('deve processar named imports', () => {
      const codigo = 'pega { soma, multiplicar } de "./math"';
      const result = resolver.resolveModules(codigo, '/project/main.gs');

      expect(result.imports).toHaveLength(1);
      expect(result.imports[0]).toMatchObject({
        type: 'named',
        imports: ['soma', 'multiplicar'],
        originalPath: './math',
        jsCode: "const { soma, multiplicar } = require('/project/math.gs');",
      });
    });

    test('deve processar mixed imports', () => {
      const codigo = 'pega Math, { PI, E } de "./constants"';
      const result = resolver.resolveModules(codigo, '/project/main.gs');

      expect(result.imports).toHaveLength(1);
      expect(result.imports[0]).toMatchObject({
        type: 'mixed',
        defaultImport: 'Math',
        namedImports: ['PI', 'E'],
        originalPath: './constants',
      });
      expect(result.imports[0].jsCode).toContain('const Math = require');
      expect(result.imports[0].jsCode).toContain('const { PI, E } = Math');
    });

    test('deve processar namespace import', () => {
      const codigo = 'pega tudo_de Utils de "./utils"';
      const result = resolver.resolveModules(codigo, '/project/main.gs');

      expect(result.imports).toHaveLength(1);
      expect(result.imports[0]).toMatchObject({
        type: 'namespace',
        namespace: 'Utils',
        originalPath: './utils',
        jsCode: "const Utils = require('/project/utils.gs');",
      });
    });

    test('deve resolver caminhos relativos corretamente', () => {
      const codigo = `
        pega utils de "./lib/utils"
        pega config de "../config"
        pega helpers de "./helpers/index"
      `;
      
      const result = resolver.resolveModules(codigo, '/project/src/main.gs');

      expect(result.imports[0].modulePath).toBe('/project/src/lib/utils.gs');
      expect(result.imports[1].modulePath).toBe('/project/config.gs');
      expect(result.imports[2].modulePath).toBe('/project/src/helpers/index.gs');
    });

    test('deve preservar caminhos absolutos e node_modules', () => {
      const codigo = `
        pega express de "express"
        pega fs de "fs"
      `;
      
      const result = resolver.resolveModules(codigo, '/project/main.gs');

      expect(result.imports[0].modulePath).toBe('express');
      expect(result.imports[1].modulePath).toBe('fs');
    });
  });

  describe('Export Processing', () => {
    test('deve processar export default', () => {
      const codigo = 'troca_ideia_principal minhaFuncao';
      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.exports).toHaveLength(1);
      expect(result.exports[0]).toMatchObject({
        type: 'default',
        value: 'minhaFuncao',
        jsCode: 'module.exports = minhaFuncao;',
      });
    });

    test('deve processar named export simples', () => {
      const codigo = 'troca_ideia soma';
      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.exports).toHaveLength(1);
      expect(result.exports[0]).toMatchObject({
        type: 'named_single',
        name: 'soma',
        jsCode: 'module.exports.soma = soma;',
      });
    });

    test('deve processar multiple named exports', () => {
      const codigo = 'troca_ideia { soma, subtracao, multiplicacao }';
      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.exports).toHaveLength(1);
      expect(result.exports[0]).toMatchObject({
        type: 'named_multiple',
        exports: ['soma', 'subtracao', 'multiplicacao'],
        jsCode: 'module.exports = { soma, subtracao, multiplicacao };',
      });
    });
  });

  describe('Complex Module Scenarios', () => {
    test('deve processar arquivo com imports e exports', () => {
      const codigo = `
        // Imports
        pega utils de "./utils"
        pega { helper1, helper2 } de "./helpers"
        
        // Code
        presta_serviço processData(data) {
          uai result é utils.process(data)
          faz_favor helper1(result)
        }
        
        // Exports
        troca_ideia processData
        troca_ideia { VERSION, CONFIG }
      `;

      const result = resolver.resolveModules(codigo, '/project/processor.gs');

      expect(result.hasModules).toBe(true);
      expect(result.imports).toHaveLength(2);
      expect(result.exports).toHaveLength(2);
      expect(result.dependencies).toHaveLength(2);
    });

    test('deve ignorar comentários', () => {
      const codigo = `
        // pega utils de "./fake"
        uai x é 42
        // troca_ideia fakeExport
      `;

      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.hasModules).toBe(false);
      expect(result.imports).toHaveLength(0);
      expect(result.exports).toHaveLength(0);
    });

    test('deve preservar código entre imports/exports', () => {
      const codigo = `
        pega utils de "./utils"
        
        uai config é { debug: true }
        
        presta_serviço init() {
          prosa("Initializing...")
        }
        
        troca_ideia init
      `;

      const result = resolver.resolveModules(codigo, '/test/file.gs');
      
      expect(result.code).toContain('uai config é { debug: true }');
      expect(result.code).toContain('presta_serviço init()');
    });
  });

  describe('Module Validation', () => {
    test('deve verificar se módulo existe - arquivo .gs', () => {
      fs.existsSync.mockImplementation((path) => {
        return path === '/project/utils.gs';
      });

      expect(resolver.moduleExists('/project/utils.gs')).toBe(true);
      expect(resolver.moduleExists('/project/missing.gs')).toBe(false);
    });

    test('deve verificar módulos Node.js', () => {
      const originalResolve = require.resolve;
      require.resolve = jest.fn().mockImplementation((module) => {
        if (module === 'fs') return '/node_modules/fs';
        throw new Error('Module not found');
      });

      expect(resolver.moduleExists('fs')).toBe(true);
      expect(resolver.moduleExists('nonexistent-package')).toBe(false);

      require.resolve = originalResolve;
    });
  });

  describe('Dependency Management', () => {
    test('deve rastrear dependências', () => {
      const codigo = `
        pega utils de "./utils"
        pega config de "./config"
      `;

      const result = resolver.resolveModules(codigo, '/project/main.gs');

      const deps = resolver.getDependencies('/project/main.gs');
      expect(deps).toEqual([
        '/project/utils.gs',
        '/project/config.gs'
      ]);
    });

    test('deve detectar dependência circular', () => {
      // Simulate circular dependency: A -> B -> A
      resolver.moduleRegistry.set('/project/a.gs', {
        dependencies: ['/project/b.gs'],
      });
      resolver.moduleRegistry.set('/project/b.gs', {
        dependencies: ['/project/a.gs'],
      });

      const circular = resolver.detectCircularDependencies('/project/a.gs');
      expect(circular).toEqual(['/project/a.gs', '/project/b.gs', '/project/a.gs']);
    });

    test('deve gerar relatório de dependências', () => {
      resolver.moduleRegistry.set('/project/main.gs', {
        imports: [{ type: 'default' }, { type: 'named' }],
        exports: [{ type: 'default' }],
        dependencies: ['/project/utils.gs'],
      });

      const report = resolver.generateDependencyReport();

      expect(report.totalModules).toBe(1);
      expect(report.modules).toHaveLength(1);
      expect(report.modules[0]).toMatchObject({
        path: '/project/main.gs',
        imports: 2,
        exports: 1,
        dependencies: ['/project/utils.gs'],
      });
    });
  });

  describe('Utility Functions', () => {
    test('deve obter informações de módulo', () => {
      const moduleInfo = {
        imports: [],
        exports: [],
        dependencies: [],
        resolved: true,
      };
      
      resolver.moduleRegistry.set('/test/module.gs', moduleInfo);

      const result = resolver.getModuleInfo('/test/module.gs');
      expect(result).toEqual(moduleInfo);
    });

    test('deve retornar null para módulo inexistente', () => {
      const result = resolver.getModuleInfo('/nonexistent/module.gs');
      expect(result).toBeNull();
    });

    test('deve limpar cache', () => {
      resolver.moduleRegistry.set('/test/module.gs', {});
      resolver.moduleCache.set('/test/module.gs', {});

      resolver.clearCache();

      expect(resolver.moduleRegistry.size).toBe(0);
      expect(resolver.moduleCache.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    test('deve lidar com espaços extras na sintaxe', () => {
      const codigo = `
        pega    utils    de    "./utils"
        pega  {  soma  ,  multiplicar  }  de  "./math"
        troca_ideia    { func1  ,  func2 }
      `;

      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.imports).toHaveLength(2);
      expect(result.exports).toHaveLength(1);
      expect(result.imports[0].importName).toBe('utils');
      expect(result.imports[1].imports).toEqual(['soma', 'multiplicar']);
    });

    test('deve lidar com linhas vazias', () => {
      const codigo = `
        
        pega utils de "./utils"
        
        
        uai x é 42
        
        troca_ideia x
        
      `;

      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.hasModules).toBe(true);
      expect(result.imports).toHaveLength(1);
      expect(result.exports).toHaveLength(1);
    });

    test('deve preservar estrutura de código complexo', () => {
      const codigo = `
        pega utils de "./utils"
        
        presta_serviço complexFunction() {
          uai nested é {
            prop: "value"
          }
          
          se (condition) {
            faz_favor nested
          }
        }
        
        troca_ideia complexFunction
      `;

      const result = resolver.resolveModules(codigo, '/test/file.gs');

      expect(result.code).toContain('presta_serviço complexFunction()');
      expect(result.code).toContain('uai nested é {');
      expect(result.code).toContain('se (condition) {');
    });
  });
});