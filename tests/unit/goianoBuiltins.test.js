const GoianoBuiltins = require('../../src/goianoMethods/GoianoBuiltins');

describe('GoianoBuiltins', () => {
  let goianoBuiltins;

  beforeEach(() => {
    goianoBuiltins = new GoianoBuiltins();
  });

  describe('Forbidden Methods Detection', () => {
    test('deve identificar métodos proibidos', () => {
      expect(goianoBuiltins.ehMetodoProibido('replace')).toBe(true);
      expect(goianoBuiltins.ehMetodoProibido('map')).toBe(true);
      expect(goianoBuiltins.ehMetodoProibido('filter')).toBe(true);
      expect(goianoBuiltins.ehMetodoProibido('forEach')).toBe(true);
    });

    test('deve permitir métodos goianos', () => {
      expect(goianoBuiltins.ehMetodoProibido('trocar')).toBe(false);
      expect(goianoBuiltins.ehMetodoProibido('mapear')).toBe(false);
      expect(goianoBuiltins.ehMetodoProibido('filtrar')).toBe(false);
      expect(goianoBuiltins.ehMetodoProibido('prosa')).toBe(false);
    });
  });

  describe('Method Conversion', () => {
    test('deve obter equivalente goiano para método JS', () => {
      expect(goianoBuiltins.obterEquivalenteGoiano('replace')).toBe('trocar');
      expect(goianoBuiltins.obterEquivalenteGoiano('map')).toBe('mapear');
      expect(goianoBuiltins.obterEquivalenteGoiano('filter')).toBe('filtrar');
      expect(goianoBuiltins.obterEquivalenteGoiano('toUpperCase')).toBe('pra_maiusculo');
    });

    test('deve retornar null para método sem equivalente', () => {
      expect(goianoBuiltins.obterEquivalenteGoiano('metodoInexistente')).toBeNull();
    });
  });

  describe('Goiano Runtime Generation', () => {
    test('deve gerar implementação goiana completa', () => {
      const runtime = goianoBuiltins.gerarImplementacaoGoiana();

      expect(runtime).toContain('String.prototype.trocar');
      expect(runtime).toContain('Array.prototype.mapear');
      expect(runtime).toContain('GoianoMath');
      expect(runtime).toContain('const certeza = true');
      expect(runtime).toContain('const de_jeito_nenhum = false');
    });

    test('deve incluir todos os métodos de string', () => {
      const runtime = goianoBuiltins.gerarImplementacaoGoiana();

      expect(runtime).toContain('pra_maiusculo');
      expect(runtime).toContain('pra_minusculo');
      expect(runtime).toContain('dividir');
      expect(runtime).toContain('trocar');
      expect(runtime).toContain('contem');
      expect(runtime).toContain('tamanho');
    });

    test('deve incluir todos os métodos de array', () => {
      const runtime = goianoBuiltins.gerarImplementacaoGoiana();

      expect(runtime).toContain('mapear');
      expect(runtime).toContain('filtrar');
      expect(runtime).toContain('reduzir');
      expect(runtime).toContain('empurrar');
      expect(runtime).toContain('forEach');
    });

    test('deve incluir GoianoMath', () => {
      const runtime = goianoBuiltins.gerarImplementacaoGoiana();

      expect(runtime).toContain('GoianoMath.sorteio');
      expect(runtime).toContain('GoianoMath.arredondar');
      expect(runtime).toContain('GoianoMath.maior');
      expect(runtime).toContain('GoianoMath.potencia');
    });
  });

  describe('Method Listing', () => {
    test('deve listar métodos goianos disponíveis', () => {
      const metodos = goianoBuiltins.listarMetodosGoianos();

      expect(Array.isArray(metodos)).toBe(true);
      expect(metodos).toContain('trocar');
      expect(metodos).toContain('mapear');
      expect(metodos).toContain('filtrar');
    });

    test('deve listar tipos goianos disponíveis', () => {
      const tipos = goianoBuiltins.listarTiposGoianos();

      expect(Array.isArray(tipos)).toBe(true);
      expect(tipos).toContain('texto');
      expect(tipos).toContain('numero');
      expect(tipos).toContain('lista');
      expect(tipos).toContain('coisa');
      expect(tipos).toContain('booleano');
    });
  });

  describe('Code Validation', () => {
    test('deve detectar uso de métodos proibidos em código', () => {
      const codigo = `
        uai nome = "João";
        nome.replace("ã", "a");
        lista.map(x => x * 2);
      `;

      const metodosProibidos = goianoBuiltins.detectarMetodosProibidos(codigo);

      expect(metodosProibidos).toContain('replace');
      expect(metodosProibidos).toContain('map');
    });

    test('deve não detectar métodos goianos válidos', () => {
      const codigo = `
        uai nome = "João";
        nome.trocar("ã", "a");
        lista.mapear(x => x * 2);
      `;

      const metodosProibidos = goianoBuiltins.detectarMetodosProibidos(codigo);

      expect(metodosProibidos).toHaveLength(0);
    });
  });

  describe('Method Documentation', () => {
    test('deve obter documentação de método goiano', () => {
      const doc = goianoBuiltins.obterDocumentacaoMetodo('trocar');

      expect(doc).toBeDefined();
      expect(doc).toContain('trocar');
    });

    test('deve obter exemplo de uso de método', () => {
      const exemplo = goianoBuiltins.obterExemploUso('mapear');

      expect(exemplo).toBeDefined();
      expect(exemplo).toContain('mapear');
    });
  });

  describe('Type Conversion', () => {
    test('deve converter tipo JavaScript para goiano', () => {
      expect(goianoBuiltins.converterTipoParaGoiano('string')).toBe('texto');
      expect(goianoBuiltins.converterTipoParaGoiano('number')).toBe('numero');
      expect(goianoBuiltins.converterTipoParaGoiano('boolean')).toBe('booleano');
      expect(goianoBuiltins.converterTipoParaGoiano('object')).toBe('coisa');
      expect(goianoBuiltins.converterTipoParaGoiano('array')).toBe('lista');
    });

    test('deve retornar tipo original se não houver conversão', () => {
      expect(goianoBuiltins.converterTipoParaGoiano('tipoDesconhecido')).toBe('tipoDesconhecido');
    });
  });

  describe('Performance Helpers', () => {
    test('deve verificar se método é otimizado', () => {
      expect(goianoBuiltins.ehMetodoOtimizado('mapear')).toBe(true);
      expect(goianoBuiltins.ehMetodoOtimizado('filtrar')).toBe(true);
    });

    test('deve obter versão otimizada de método', () => {
      const otimizado = goianoBuiltins.obterVersaoOtimizada('mapear');

      expect(otimizado).toBeDefined();
      expect(otimizado).toContain('performance');
    });
  });
});