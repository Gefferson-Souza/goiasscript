const GoiasScriptCompiler = require('../../src/compiler');

describe('GoiasScriptCompiler', () => {
  let compiler;

  beforeEach(() => {
    compiler = new GoiasScriptCompiler();
  });

  describe('Compilação Básica', () => {
    test('deve compilar código simples com sucesso', () => {
      const codigo = 'uai nome é \"João\"; prosa(nome);';
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('const nome = \"João\"');
      expect(resultado.javascript).toContain('console.log(nome)');
    });

    test('deve compilar função simples', () => {
      const codigo = `
        faz_trem saudar(nome) {
          faz_favor \"Olá, \" mais nome;
        }
      `;
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('function saudar(nome)');
      expect(resultado.javascript).toContain('return \"Olá, \" + nome');
    });

    test('deve compilar estruturas condicionais', () => {
      const codigo = `
        se_ocê_quiser (idade maior_que 18) {
          prosa(\"Maior de idade\");
        } se_não {
          prosa(\"Menor de idade\");
        }
      `;
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('if (idade > 18)');
      expect(resultado.javascript).toContain('else');
    });
  });

  describe('Classes e Objetos', () => {
    test('deve compilar classe simples', () => {
      const codigo = `
        arruma_trem Pessoa {
          aprepara_trem(nome) {
            ocê.nome é nome;
          }
        }
      `;
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('class Pessoa');
      expect(resultado.javascript).toContain('constructor(nome)');
      expect(resultado.javascript).toContain('this.nome = nome');
    });

    test('deve compilar herança de classes', () => {
      const codigo = `
        arruma_trem Cachorro inherda_de Animal {
          aprepara_trem(nome, raca) {
            super(nome);
            ocê.raca é raca;
          }
        }
      `;
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('class Cachorro extends Animal');
      expect(resultado.javascript).toContain('constructor(nome, raca)');
      expect(resultado.javascript).toContain('super(nome)');
    });
  });

  describe('Programação Assíncrona', () => {
    test('deve compilar função async/await', () => {
      const codigo = `
        vai_na_frente_faz_trem buscarDados() {
          uai resultado é espera_um_cadim fetch(\"/api/dados\");
          faz_favor resultado;
        }
      `;
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('async function buscarDados()');
      expect(resultado.javascript).toContain('const resultado = await fetch(\"/api/dados\")');
    });

    test('deve compilar promises', () => {
      const codigo = `
        faz_um promessa((resolve_aí, rejeita_isso) => {
          setTimeout(() => resolve_aí(\"sucesso\"), 1000);
        })
      `;
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('new Promise((resolve, reject)');
      expect(resultado.javascript).toContain('resolve(\"sucesso\")');
    });
  });

  describe('Tratamento de Erros', () => {
    test('deve compilar try/catch', () => {
      const codigo = `
        tenta_aí {
          prosa(\"Tentando algo\");
        } se_der_ruim (erro) {
          reclama(erro);
        }
      `;
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.javascript).toContain('try {');
      expect(resultado.javascript).toContain('catch (erro)');
      expect(resultado.javascript).toContain('console.error(erro)');
    });
  });

  describe('Validação', () => {
    test('deve validar sintaxe correta', () => {
      const codigo = 'uai x é 10; prosa(x);';
      const resultado = compiler.validate(codigo);

      expect(resultado.valid).toBe(true);
      expect(resultado.errors).toHaveLength(0);
      expect(resultado.tokens.length).toBeGreaterThan(0);
    });

    test('deve detectar erros de sintaxe', () => {
      const codigo = 'uai x é {{{ // sintaxe incorreta';
      const resultado = compiler.validate(codigo);

      expect(resultado.valid).toBe(false);
      expect(resultado.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Transpilação', () => {
    test('deve transpilar apenas sem executar', () => {
      const codigo = 'uai msg é \"Teste\"; prosa(msg);';
      const javascript = compiler.transpileOnly(codigo);

      expect(javascript).toBeTruthy();
      expect(javascript).toContain('const msg = \"Teste\"');
      expect(javascript).toContain('console.log(msg)');
    });
  });

  describe('Estatísticas', () => {
    test('deve gerar estatísticas de compilação', () => {
      const codigo = 'uai x é 1; prosa(x);';
      const resultado = compiler.compile(codigo);

      expect(resultado.success).toBe(true);
      expect(resultado.stats).toBeDefined();
      expect(resultado.stats.originalSize).toBeGreaterThan(0);
      expect(resultado.stats.compiledSize).toBeGreaterThan(0);
      expect(resultado.stats.originalLines).toBeGreaterThan(0);
    });
  });

  describe('Execute', () => {
    test('deve executar código simples', async () => {
      const codigo = 'uai x é 42; prosa("Valor:", x);';
      
      // Spy on console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await compiler.execute(codigo);
      
      expect(consoleSpy).toHaveBeenCalledWith('Valor:', 42);
      consoleSpy.mockRestore();
    });

    test('deve lidar com erros de execução', async () => {
      const codigo = 'uai x é variavel_inexistente;';
      
      // Mock mostrarErro method
      const mockMostrarErro = jest.fn();
      
      // Temporarily replace the error translator method
      const originalTranslate = compiler.transpiler.errorTranslator.translate;
      compiler.transpiler.errorTranslator.translate = jest.fn().mockReturnValue({
        mostrarErro: mockMostrarErro
      });
      
      await compiler.execute(codigo);
      
      expect(mockMostrarErro).toHaveBeenCalled();
      
      // Restore original method
      compiler.transpiler.errorTranslator.translate = originalTranslate;
    });

    test('deve lidar com erro de compilação na execução', async () => {
      // Test successful error handling in execution flow
      const codigo = 'uai resultado é indefinido_var + 1';
      
      // Test should complete without throwing
      await expect(compiler.execute(codigo)).resolves.not.toThrow();
    });
  });

  describe('Casos Edge e Validação Avançada', () => {
    test('deve detectar erro de JavaScript gerado', () => {
      // Test with code that compiles but generates invalid JavaScript
      const codigo = 'uai x é function(';
      const resultado = compiler.validate(codigo);
      
      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toHaveLength(1);
    });

    test('deve lidar com erro durante validação', () => {
      // Mock transpiler to throw an error
      const originalTranspile = compiler.transpiler.transpile;
      compiler.transpiler.transpile = jest.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      
      const resultado = compiler.validate('qualquer codigo');
      
      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toHaveLength(1);
      
      // Restore original method
      compiler.transpiler.transpile = originalTranspile;
    });

    test('deve lidar com erro durante tokenização', () => {
      // Mock lexer to throw an error
      const originalTokenize = compiler.lexer.tokenize;
      compiler.lexer.tokenize = jest.fn().mockImplementation(() => {
        throw new Error('Lexer error');
      });
      
      const resultado = compiler.validate('qualquer codigo');
      
      expect(resultado.valid).toBe(false);
      expect(resultado.errors).toHaveLength(1);
      expect(resultado.tokens).toEqual([]);
      
      // Restore original method
      compiler.lexer.tokenize = originalTokenize;
    });
  });
});