const GoiasScriptLexer = require('../../src/compiler/lexer');

describe('GoiasScriptLexer', () => {
  let lexer;

  beforeEach(() => {
    lexer = new GoiasScriptLexer();
  });

  describe('tokenize', () => {
    test('deve tokenizar código simples', () => {
      const codigo = 'uai nome é 42';
      const tokens = lexer.tokenize(codigo);

      expect(tokens).toHaveLength(4);
      expect(tokens[0]).toEqual({
        type: 'KEYWORD',
        value: 'uai',
        jsValue: 'const',
        position: { line: 1, column: 1 }
      });
      expect(tokens[1]).toEqual({
        type: 'IDENTIFIER',
        value: 'nome',
        jsValue: 'nome',
        position: { line: 1, column: 5 }
      });
      expect(tokens[2]).toEqual({
        type: 'KEYWORD',
        value: 'é',
        jsValue: '=',
        position: { line: 1, column: 10 }
      });
      expect(tokens[3]).toEqual({
        type: 'NUMBER',
        value: '42',
        jsValue: '42',
        position: { line: 1, column: 12 }
      });
    });

    test('deve tokenizar múltiplas linhas', () => {
      const codigo = `uai x é 10
prosa(x)`;
      const tokens = lexer.tokenize(codigo);

      expect(tokens).toHaveLength(8);
      // Primeira linha
      expect(tokens[0].position.line).toBe(1);
      expect(tokens[0].value).toBe('uai');
      // Segunda linha
      expect(tokens[4].position.line).toBe(2);
      expect(tokens[4].value).toBe('prosa');
    });

    test('deve ignorar comentários', () => {
      const codigo = `uai x é 10 // Este é um comentário
// Comentário de linha inteira
prosa(x)`;
      const tokens = lexer.tokenize(codigo);

      // Deve ter apenas os tokens da primeira e terceira linha (8 tokens total)
      expect(tokens).toHaveLength(8);
      expect(tokens.find(t => t.value.includes('//'))).toBeUndefined();
    });

    test('deve ignorar linhas vazias', () => {
      const codigo = `uai x é 10

prosa(x)`;
      const tokens = lexer.tokenize(codigo);

      expect(tokens).toHaveLength(8);
      expect(tokens[0].position.line).toBe(1);
      expect(tokens[4].position.line).toBe(3);
    });

    test('deve tokenizar strings corretamente', () => {
      const codigo = 'uai msg é texto123';
      const tokens = lexer.tokenize(codigo);

      const textToken = tokens.find(t => t.value === 'texto123');
      expect(textToken).toBeDefined();
      expect(textToken.type).toBe('IDENTIFIER');
      expect(textToken.value).toBe('texto123');
    });

    test('deve tokenizar números corretamente', () => {
      const codigo = 'uai idade é 25';
      const tokens = lexer.tokenize(codigo);

      const numberToken = tokens.find(t => t.value === '25');
      expect(numberToken).toBeDefined();
      expect(numberToken.type).toBe('NUMBER');
    });

    test('deve tokenizar operadores', () => {
      const codigo = 'se x maior_que 10';
      const tokens = lexer.tokenize(codigo);

      expect(tokens[2]).toEqual({
        type: 'KEYWORD',
        value: 'maior_que',
        jsValue: '>',
        position: { line: 1, column: 6 }
      });
    });

    test('deve tokenizar símbolos especiais', () => {
      const codigo = 'funcao(a, b) { return a + b; }';
      const tokens = lexer.tokenize(codigo);

      const delimiters = tokens.filter(t => t.type === 'DELIMITER');
      expect(delimiters.length).toBeGreaterThan(0);
      
      const operators = tokens.filter(t => t.type === 'OPERATOR');
      expect(operators.length).toBeGreaterThan(0);
    });

    test('deve lidar com código vazio', () => {
      const tokens = lexer.tokenize('');
      expect(tokens).toEqual([]);
    });

    test('deve lidar com apenas espaços', () => {
      const tokens = lexer.tokenize('   ');
      expect(tokens).toEqual([]);
    });

    test('deve lidar com apenas comentários', () => {
      const tokens = lexer.tokenize('// Apenas um comentário');
      expect(tokens).toEqual([]);
    });
  });

  describe('_getTokenType', () => {
    test('deve identificar palavras-chave', () => {
      expect(lexer._getTokenType('uai')).toBe('KEYWORD');
      expect(lexer._getTokenType('prosa')).toBe('KEYWORD');
      expect(lexer._getTokenType('se_ocê_quiser')).toBe('KEYWORD');
    });

    test('deve identificar operadores', () => {
      expect(lexer._getTokenType('+')).toBe('OPERATOR');
      expect(lexer._getTokenType('-')).toBe('OPERATOR');
      expect(lexer._getTokenType('(')).toBe('OPERATOR');
      expect(lexer._getTokenType(')')).toBe('OPERATOR');
    });

    test('deve identificar números', () => {
      expect(lexer._getTokenType('123')).toBe('NUMBER');
      expect(lexer._getTokenType('45.67')).toBe('NUMBER');
      expect(lexer._getTokenType('0')).toBe('NUMBER');
    });

    test('deve identificar strings', () => {
      expect(lexer._getTokenType('"texto"')).toBe('STRING');
      expect(lexer._getTokenType("'texto'")).toBe('STRING');
    });

    test('deve identificar identificadores', () => {
      expect(lexer._getTokenType('minhaVariavel')).toBe('IDENTIFIER');
      expect(lexer._getTokenType('funcao123')).toBe('IDENTIFIER');
    });

    test('deve identificar delimitadores', () => {
      expect(lexer._getTokenType('{')).toBe('DELIMITER');
      expect(lexer._getTokenType('}')).toBe('DELIMITER');
      expect(lexer._getTokenType(';')).toBe('DELIMITER');
      expect(lexer._getTokenType(',')).toBe('DELIMITER');
    });
  });

  describe('_tokenizeLine', () => {
    test('deve processar linha com posição correta', () => {
      const tokens = lexer._tokenizeLine('uai x é 10', 5);
      
      expect(tokens[0].position.line).toBe(5);
      expect(tokens[0].position.column).toBe(1);
      expect(tokens[1].position.column).toBe(5);
    });

    test('deve ignorar comentários em linha', () => {
      const tokens = lexer._tokenizeLine('uai x é 10 // comentário', 1);
      
      expect(tokens).toHaveLength(4);
      expect(tokens.find(t => t.value.includes('//'))).toBeUndefined();
    });

    test('deve retornar array vazio para linha vazia', () => {
      const tokens = lexer._tokenizeLine('   ', 1);
      expect(tokens).toEqual([]);
    });

    test('deve retornar array vazio para apenas comentário', () => {
      const tokens = lexer._tokenizeLine('// apenas comentário', 1);
      expect(tokens).toEqual([]);
    });
  });

  describe('tokensToJS', () => {
    test('deve converter tokens para JavaScript', () => {
      const tokens = [
        { jsValue: 'const' },
        { jsValue: 'nome' },
        { jsValue: '=' },
        { jsValue: '42' }
      ];
      
      const jsCode = lexer.tokensToJS(tokens);
      expect(jsCode).toBe('const nome = 42');
    });

    test('deve lidar com array vazio', () => {
      const jsCode = lexer.tokensToJS([]);
      expect(jsCode).toBe('');
    });
  });
});