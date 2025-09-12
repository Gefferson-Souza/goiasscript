const TypeAnalyzer = require('../../src/types/TypeAnalyzer');

describe('TypeAnalyzer', () => {
  let analyzer;

  beforeEach(() => {
    analyzer = new TypeAnalyzer();
  });

  describe('Basic Type Inference', () => {
    test('deve inferir tipos básicos corretamente', () => {
      const codigo = `
        uai nome é "João"
        uai idade é 25
        uai ativo é certeza
        uai vazio é null
      `;

      const result = analyzer.analyze(codigo);

      expect(result.symbolTable.nome.type).toBe('STRING');
      expect(result.symbolTable.idade.type).toBe('NUMBER');
      expect(result.symbolTable.ativo.type).toBe('BOOLEAN');
      expect(result.symbolTable.vazio.type).toBe('NULL');
    });

    test('deve inferir tipos de arrays e objects', () => {
      const codigo = `
        uai lista é [1, 2, 3]
        uai pessoa é { nome: "Maria", idade: 30 }
      `;

      const result = analyzer.analyze(codigo);

      expect(result.symbolTable.lista.type).toBe('ARRAY');
      expect(result.symbolTable.pessoa.type).toBe('OBJECT');
    });

    test('deve inferir tipos de números decimais', () => {
      const codigo = `
        uai preco é 19.99
        uai desconto é 0.15
      `;

      const result = analyzer.analyze(codigo);

      expect(result.symbolTable.preco.type).toBe('NUMBER');
      expect(result.symbolTable.desconto.type).toBe('NUMBER');
    });
  });

  describe('Function Analysis', () => {
    test('deve analisar declarações de função', () => {
      const codigo = `
        presta_serviço saudar(nome) {
          faz_favor "Oi " mais nome
        }
        
        vai_na_frente_presta_serviço buscarDados(url) {
          faz_favor fetch(url)
        }
      `;

      const result = analyzer.analyze(codigo);

      expect(result.symbolTable.saudar.type).toBe('FUNCTION');
      expect(result.symbolTable.saudar.async).toBe(false);
      expect(result.symbolTable.buscarDados.type).toBe('FUNCTION');
      expect(result.symbolTable.buscarDados.async).toBe(true);
    });

    test('deve analisar parâmetros com tipos', () => {
      const codigo = `
        presta_serviço calcular(a: numero, b: numero) {
          faz_favor a mais b
        }
      `;

      const result = analyzer.analyze(codigo);

      expect(result.symbolTable.calcular.parameters).toHaveLength(2);
      expect(result.symbolTable.calcular.parameters[0].name).toBe('a');
      expect(result.symbolTable.calcular.parameters[0].type).toBe('NUMBER');
    });
  });

  describe('Type Warnings', () => {
    test('deve detectar mudança de tipo', () => {
      const codigo = `
        trem x é 42
        x é "texto"
      `;

      const result = analyzer.analyze(codigo);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('type_mismatch');
      expect(result.warnings[0].message).toContain('número');
      expect(result.warnings[0].message).toContain('texto');
    });

    test('deve detectar reatribuição de constante', () => {
      const codigo = `
        uai CONSTANTE é 42
        CONSTANTE é 50
      `;

      const result = analyzer.analyze(codigo);

      expect(result.warnings.length).toBeGreaterThanOrEqual(1);
      const constWarning = result.warnings.find(w => w.type === 'const_reassignment');
      expect(constWarning).toBeDefined();
      expect(constWarning.message).toContain('constante');
    });

    test('deve detectar variável não declarada', () => {
      const codigo = `
        x é 42
      `;

      const result = analyzer.analyze(codigo);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('undeclared_variable');
      expect(result.warnings[0].message).toContain('não foi declarado');
    });

    test('deve detectar função indefinida', () => {
      const codigo = `
        funcaoInexistente(42)
      `;

      const result = analyzer.analyze(codigo);

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('undefined_function');
      expect(result.warnings[0].message).toContain('não existe');
    });

    test('não deve avisar sobre funções built-in', () => {
      const codigo = `
        prosa("Hello")
        setTimeout(() => {}, 1000)
        Math.random()
      `;

      const result = analyzer.analyze(codigo);

      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Binary Operations Type Inference', () => {
    test('deve inferir tipo de operações numéricas', () => {
      const codigo = `
        uai a é 10
        uai b é 20
        uai soma é a mais b
        uai produto é a vezes b
      `;

      const result = analyzer.analyze(codigo);

      expect(result.symbolTable.soma.type).toBe('NUMBER');
      expect(result.symbolTable.produto.type).toBe('NUMBER');
    });

    test('deve inferir concatenação de strings', () => {
      const codigo = `
        uai nome é "João"
        uai sobrenome é "Silva"
        uai nomeCompleto é nome mais sobrenome
      `;

      const result = analyzer.analyze(codigo);

      expect(result.symbolTable.nomeCompleto.type).toBe('STRING');
    });
  });

  describe('Utility Methods', () => {
    test('deve obter informações de variável', () => {
      const codigo = `uai teste é 42`;
      analyzer.analyze(codigo);

      const varInfo = analyzer.getVariableType('teste');
      expect(varInfo).toBeDefined();
      expect(varInfo.type).toBe('NUMBER');
      expect(varInfo.declarationType).toBe('const');
    });

    test('deve retornar null para variável inexistente', () => {
      const varInfo = analyzer.getVariableType('inexistente');
      expect(varInfo).toBeNull();
    });

    test('deve validar compatibilidade de tipos', () => {
      expect(analyzer.isTypeCompatible('NUMBER', 'NUMBER')).toBe(true);
      expect(analyzer.isTypeCompatible('STRING', 'NUMBER')).toBe(true);
      expect(analyzer.isTypeCompatible('NUMBER', 'BOOLEAN')).toBe(false);
      expect(analyzer.isTypeCompatible('UNKNOWN', 'STRING')).toBe(true);
    });
  });

  describe('Comments and Empty Lines', () => {
    test('deve ignorar comentários e linhas vazias', () => {
      const codigo = `
        // Este é um comentário
        uai x é 42
        
        // Outro comentário
        uai y é "texto"
      `;

      const result = analyzer.analyze(codigo);

      expect(result.typeCount).toBe(2);
      expect(result.symbolTable.x.type).toBe('NUMBER');
      expect(result.symbolTable.y.type).toBe('STRING');
    });
  });

  describe('Complex Scenarios', () => {
    test('deve analisar código complexo com múltiplas declarações', () => {
      const codigo = `
        uai nome é "GoiásScript"
        uai versao é 2.0
        uai recursos é ["tipos", "modules", "lsp"]
        
        presta_serviço inicializar(config: objeto) {
          prosa("Iniciando " mais nome)
          faz_favor certeza
        }
        
        trem contador é 0
        contador é contador mais 1
      `;

      const result = analyzer.analyze(codigo);

      expect(result.typeCount).toBe(5);
      expect(result.symbolTable.nome.type).toBe('STRING');
      expect(result.symbolTable.versao.type).toBe('NUMBER');
      expect(result.symbolTable.recursos.type).toBe('ARRAY');
      expect(result.symbolTable.inicializar.type).toBe('FUNCTION');
      expect(result.symbolTable.contador.type).toBe('NUMBER');
      expect(result.symbolTable.contador.declarationType).toBe('var');
    });

    test('deve gerar relatório de análise completo', () => {
      const codigo = `
        uai x é 42
        x é "mudou"
        funcaoInexistente()
      `;

      const result = analyzer.analyze(codigo);

      expect(result.hasTypeErrors).toBe(false); // Only warnings for now
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.typeCount).toBe(1);
      expect(result.symbolTable).toBeDefined();
    });
  });
});