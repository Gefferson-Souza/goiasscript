const ErroGoiano = require('./ErroGoiano');

/**
 * Tradutor de erros JavaScript para erros goianos
 * Implementa Strategy Pattern para diferentes tipos de erros
 */
class ErrorTranslator {
  constructor() {
    // Strategy Pattern - estratégias para traduzir diferentes tipos de erros
    this.strategies = {
      SyntaxError: this._translateSyntaxError.bind(this),
      ReferenceError: this._translateReferenceError.bind(this),
      TypeError: this._translateTypeError.bind(this),
      URIError: this._translateURIError.bind(this),
      RangeError: this._translateRangeError.bind(this),
      EvalError: this._translateEvalError.bind(this),
    };
  }

  /**
   * Traduz erros de JavaScript para erros goianos
   * @param {Error} erro - Erro JavaScript original
   * @param {string} arquivo - Nome do arquivo onde ocorreu o erro
   * @returns {ErroGoiano} Erro traduzido para o estilo goiano
   */
  traduzir(erro, arquivo) {
    // Se já é um erro goiano, retorna como está
    if (erro instanceof ErroGoiano) {
      return erro;
    }
    
    // Extrair informações do erro
    const { linha, coluna } = this._extrairLocalizacao(erro);
    const strategy = this.strategies[erro.constructor.name];
    
    if (strategy) {
      return strategy(erro, arquivo, linha, coluna);
    }
    
    // Fallback para erros não mapeados
    return this._translateGenericError(erro, arquivo, linha, coluna);
  }

  /**
   * Extrai linha e coluna do stack trace
   * @private
   */
  _extrairLocalizacao(erro) {
    let linha = erro.lineNumber;
    let coluna = erro.columnNumber;
    const stack = erro.stack;
    
    // Extrair do stack trace se não estiverem disponíveis
    if (linha === undefined && stack) {
      const match = stack.match(/:(\d+):(\d+)/);
      if (match) {
        linha = parseInt(match[1], 10);
        coluna = parseInt(match[2], 10);
      }
    }
    
    return { linha, coluna };
  }

  /**
   * Strategy para SyntaxError
   * @private
   */
  _translateSyntaxError(erro, arquivo, linha, coluna) {
    const mensagemOriginal = erro.message;
    let mensagemGoiana = 'Sintaxe tá embrulhada que nem pamonha!';
    let dica = 'Dá uma olhada boa no código que deve ter algo errado na escrita.';

    if (mensagemOriginal.includes('Unexpected token')) {
      const token = mensagemOriginal.match(/Unexpected token '(.+?)'/)?.[1] || 'desconhecido';
      mensagemGoiana = `Achei um '${token}' onde não deveria ter!`;
      dica = 'Vê se não escreveu alguma coisa fora do lugar ou esqueceu de fechar parênteses, chaves ou colchetes.';
    } else if (mensagemOriginal.includes('Unexpected identifier')) {
      const id = mensagemOriginal.match(/Unexpected identifier '(.+?)'/)?.[1] || '';
      mensagemGoiana = `Esse identificador '${id}' tá no lugar errado!`;
      dica = 'Vê se não tá faltando uma vírgula, ponto-e-vírgula ou operador entre as palavras.';
    } else if (mensagemOriginal.includes('Unexpected end of input')) {
      mensagemGoiana = 'O código acabou antes da hora, uai!';
      dica = 'Parece que ocê esqueceu de fechar alguma chave {} ou parêntese () em algum lugar.';
    }

    return new ErroGoiano('sintaxe', mensagemGoiana, dica, linha, coluna, arquivo);
  }

  /**
   * Strategy para ReferenceError
   * @private
   */
  _translateReferenceError(erro, arquivo, linha, coluna) {
    const mensagemOriginal = erro.message;
    let mensagemGoiana = 'Ocê tá usando um trem que não existe!';
    let dica = 'Confira se escreveu certo o nome da variável ou função.';

    if (mensagemOriginal.includes('is not defined')) {
      const varName = mensagemOriginal.match(/(\w+) is not defined/)?.[1] || '';
      mensagemGoiana = `Esse trem '${varName}' não existe por aqui, uai!`;
      dica = 'Ocê precisa declarar ele com "uai" ou "trem" antes de usar, ou então errou o nome.';
    }

    return new ErroGoiano('referencia', mensagemGoiana, dica, linha, coluna, arquivo);
  }

  /**
   * Strategy para TypeError
   * @private
   */
  _translateTypeError(erro, arquivo, linha, coluna) {
    const mensagemOriginal = erro.message;
    let mensagemGoiana = 'Ocê tá tentando usar o trem do jeito errado!';
    let dica = 'Veja se não tá confundindo os tipos.';

    if (mensagemOriginal.includes('is not a function')) {
      const funcName = mensagemOriginal.match(/(\w+) is not a function/)?.[1] || '';
      mensagemGoiana = `'${funcName}' não é uma função, não dá pra chamar assim não!`;
      dica = 'Vê se não tá confundindo variável com função. Funções são chamadas com parênteses.';
    } else if (mensagemOriginal.includes('Cannot read propert')) {
      mensagemGoiana = 'Não consigo ler essa propriedade. O trem tá vazio!';
      dica = 'Vê se a variável não tá vazia (null/undefined) antes de usar.';
    }

    return new ErroGoiano('tipo', mensagemGoiana, dica, linha, coluna, arquivo);
  }

  /**
   * Strategy para URIError
   * @private
   */
  _translateURIError(erro, arquivo, linha, coluna) {
    return new ErroGoiano(
      'uri',
      'Esse endereço de internet tá todo embrulhado!',
      'Tem caractere esquisito na URL que não consigo entender.',
      linha,
      coluna,
      arquivo
    );
  }

  /**
   * Strategy para RangeError
   * @private
   */
  _translateRangeError(erro, arquivo, linha, coluna) {
    const mensagemOriginal = erro.message;
    let mensagemGoiana = 'Esse número tá fora do limite, uai!';
    let dica = 'Vê se não tá usando um valor muito grande ou muito pequeno.';

    if (mensagemOriginal.includes('Maximum call stack size exceeded')) {
      mensagemGoiana = 'O código tá chamando ele mesmo mais que comitiva em festa!';
      dica = 'Ocê tem uma função que tá chamando ela mesma sem parar (recursão infinita).';
    }

    return new ErroGoiano('intervalo', mensagemGoiana, dica, linha, coluna, arquivo);
  }

  /**
   * Strategy para EvalError
   * @private
   */
  _translateEvalError(erro, arquivo, linha, coluna) {
    return new ErroGoiano(
      'eval',
      'Problema com eval - mas ocê nem deveria usar isso!',
      'Eval é perigoso, sô! Use outras formas de executar código.',
      linha,
      coluna,
      arquivo
    );
  }

  /**
   * Fallback para erros genéricos
   * @private
   */
  _translateGenericError(erro, arquivo, linha, coluna) {
    return new ErroGoiano(
      'execucao',
      `Erro não identificado: ${erro.message}`,
      'Esse tipo de erro é meio cabrero de entender. Tenta ver o que causou ele.',
      linha,
      coluna,
      arquivo
    );
  }
}

module.exports = ErrorTranslator;