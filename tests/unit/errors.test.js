const ErroGoiano = require('../../src/errors/ErroGoiano');
const ErrorTranslator = require('../../src/errors/errorTranslator');

describe('ErroGoiano', () => {
  test('deve criar erro com informações básicas', () => {
    const erro = new ErroGoiano(
      'sintaxe',
      'Erro de teste',
      'Dica de teste',
      10,
      5,
      'teste.gs'
    );

    expect(erro.name).toBe('ErroGoiano');
    expect(erro.tipo).toBe('sintaxe');
    expect(erro.dica).toBe('Dica de teste');
    expect(erro.linha).toBe(10);
    expect(erro.coluna).toBe(5);
    expect(erro.arquivo).toBe('teste.gs');
    expect(erro.message).toContain('sintaxe torta');
    expect(erro.message).toContain('teste.gs');
    expect(erro.message).toContain('linha 10');
  });

  test('deve retornar detalhes estruturados', () => {
    const erro = new ErroGoiano('referencia', 'Variável não existe', 'Declare a variável');
    const detalhes = erro.getDetalhes();

    expect(detalhes.tipo).toBe('referencia');
    expect(detalhes.dica).toBe('Declare a variável');
    expect(detalhes.localizacao).toBeDefined();
    expect(detalhes.timestamp).toBeDefined();
  });

  test('deve mapear tipos de erro corretamente', () => {
    const casos = [
      ['sintaxe', 'sintaxe torta'],
      ['referencia', 'trem que não existe'],
      ['tipo', 'tipo errado de trem'],
      ['divisao_zero', 'dividiu por zero'],
      ['desconhecido', 'trem desconhecido']
    ];

    casos.forEach(([tipo, esperado]) => {
      const erro = new ErroGoiano(tipo, 'Mensagem teste');
      expect(erro.message).toContain(esperado);
    });
  });
});

describe('ErrorTranslator', () => {
  let translator;

  beforeEach(() => {
    translator = new ErrorTranslator();
  });

  test('deve manter erros goianos como estão', () => {
    const erroOriginal = new ErroGoiano('teste', 'Erro original');
    const resultado = translator.traduzir(erroOriginal, 'teste.gs');

    expect(resultado).toBe(erroOriginal);
  });

  test('deve traduzir SyntaxError', () => {
    const erro = new SyntaxError('Unexpected token \\'{\\'');
    const resultado = translator.traduzir(erro, 'teste.gs');

    expect(resultado).toBeInstanceOf(ErroGoiano);
    expect(resultado.tipo).toBe('sintaxe');
    expect(resultado.message).toContain('\\'{}\\'');
    expect(resultado.dica).toContain('parênteses, chaves ou colchetes');
  });

  test('deve traduzir ReferenceError', () => {
    const erro = new ReferenceError('variavel is not defined');
    const resultado = translator.traduzir(erro, 'teste.gs');

    expect(resultado).toBeInstanceOf(ErroGoiano);
    expect(resultado.tipo).toBe('referencia');
    expect(resultado.message).toContain('\\'variavel\\'');
    expect(resultado.dica).toContain('declarar');
  });

  test('deve traduzir TypeError', () => {
    const erro = new TypeError('funcao is not a function');
    const resultado = translator.traduzir(erro, 'teste.gs');

    expect(resultado).toBeInstanceOf(ErroGoiano);
    expect(resultado.tipo).toBe('tipo');
    expect(resultado.message).toContain('\\'funcao\\' não é uma função');
    expect(resultado.dica).toContain('parênteses');
  });

  test('deve traduzir RangeError', () => {
    const erro = new RangeError('Maximum call stack size exceeded');
    const resultado = translator.traduzir(erro, 'teste.gs');

    expect(resultado).toBeInstanceOf(ErroGoiano);
    expect(resultado.tipo).toBe('intervalo');
    expect(resultado.message).toContain('comitiva em festa');
    expect(resultado.dica).toContain('recursão infinita');
  });

  test('deve traduzir URIError', () => {
    const erro = new URIError('Malformed URI');
    const resultado = translator.traduzir(erro, 'teste.gs');

    expect(resultado).toBeInstanceOf(ErroGoiano);
    expect(resultado.tipo).toBe('uri');
    expect(resultado.message).toContain('endereço de internet');
  });

  test('deve lidar com erros genéricos', () => {
    const erro = new Error('Erro desconhecido');
    const resultado = translator.traduzir(erro, 'teste.gs');

    expect(resultado).toBeInstanceOf(ErroGoiano);
    expect(resultado.tipo).toBe('execucao');
    expect(resultado.message).toContain('Erro não identificado');
  });
});