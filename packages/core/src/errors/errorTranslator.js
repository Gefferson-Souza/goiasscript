const ErroGoiano = require('./ErroGoiano');

/**
 * JavaScript to Goias error translator
 * Implements Strategy Pattern for different error types
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
   * Translates JavaScript errors to Goias errors
   * @param {Error} error - Original JavaScript error
   * @param {string} fileName - Name of the file where the error occurred
   * @returns {ErroGoiano} Error translated to Goias style
   */
  translate(error, fileName) {
    // If already a Goias error, return as is
    if (error instanceof ErroGoiano) {
      return error;
    }
    
    // Extract error information
    const { line, column } = this._extractLocation(error);
    const strategy = this.strategies[error.constructor.name];
    
    if (strategy) {
      return strategy(error, fileName, line, column);
    }
    
    // Fallback for unmapped errors
    return this._translateGenericError(error, fileName, line, column);
  }

  /**
   * Extracts line and column from stack trace
   * @private
   */
  _extractLocation(error) {
    let line = error.lineNumber;
    let column = error.columnNumber;
    const stack = error.stack;
    
    // Extract from stack trace if not available
    if (line === undefined && stack) {
      const match = stack.match(/:(\d+):(\d+)/);
      if (match) {
        line = parseInt(match[1], 10);
        column = parseInt(match[2], 10);
      }
    }
    
    return { line, column };
  }

  /**
   * Strategy para SyntaxError
   * @private
   */
  _translateSyntaxError(error, fileName, line, column) {
    const originalMessage = error.message;
    let goiasMessage = 'Sintaxe tá embrulhada que nem pamonha!';
    let tip = 'Dá uma olhada boa no código que deve ter algo errado na escrita.';

    if (originalMessage.includes('Unexpected token')) {
      const token = originalMessage.match(/Unexpected token ["'](.+?)["']/)?.[1] || 
                   originalMessage.match(/Unexpected token (.+?)(\s|$)/)?.[1] || 'desconhecido';
      goiasMessage = `Achei um '${token}' onde não deveria ter!`;
      tip = 'Vê se não escreveu alguma coisa fora do lugar ou esqueceu de fechar ' +
            'parênteses, chaves ou colchetes.';
    } else if (originalMessage.includes('Unexpected identifier')) {
      const id = originalMessage.match(/Unexpected identifier '(.+?)'/)?.[1] || '';
      goiasMessage = `Esse identificador '${id}' tá no lugar errado!`;
      tip = 'Vê se não tá faltando uma vírgula, ponto-e-vírgula ou operador entre as palavras.';
    } else if (originalMessage.includes('Unexpected end of input')) {
      goiasMessage = 'O código acabou antes da hora, uai!';
      tip = 'Parece que ocê esqueceu de fechar alguma chave {} ou parêntese () em algum lugar.';
    }

    return new ErroGoiano('sintaxe', goiasMessage, tip, line, column, fileName);
  }

  /**
   * Strategy para ReferenceError
   * @private
   */
  _translateReferenceError(error, fileName, line, column) {
    const originalMessage = error.message;
    let goiasMessage = 'Ocê tá usando um trem que não existe!';
    let tip = 'Confira se escreveu certo o nome da variável ou função.';

    if (originalMessage.includes('is not defined')) {
      const varName = originalMessage.match(/(\w+) is not defined/)?.[1] || '';
      goiasMessage = `Esse trem '${varName}' não existe por aqui, uai!`;
      tip = 'Ocê precisa declarar ele com "uai" ou "trem" antes de usar, ou então errou o nome.';
    }

    return new ErroGoiano('referencia', goiasMessage, tip, line, column, fileName);
  }

  /**
   * Strategy para TypeError
   * @private
   */
  _translateTypeError(error, fileName, line, column) {
    const originalMessage = error.message;
    let goiasMessage = 'Ocê tá tentando usar o trem do jeito errado!';
    let tip = 'Veja se não tá confundindo os tipos.';

    if (originalMessage.includes('is not a function')) {
      const funcName = originalMessage.match(/(\w+) is not a function/)?.[1] || '';
      goiasMessage = `'${funcName}' não é uma função, não dá pra chamar assim não!`;
      tip = 'Vê se não tá confundindo variável com função. Funções são chamadas com parênteses.';
    } else if (originalMessage.includes('Cannot read propert')) {
      goiasMessage = 'Não consigo ler essa propriedade. O trem tá vazio!';
      tip = 'Vê se a variável não tá vazia (null/undefined) antes de usar.';
    }

    return new ErroGoiano('tipo', goiasMessage, tip, line, column, fileName);
  }

  /**
   * Strategy para URIError
   * @private
   */
  _translateURIError(error, fileName, line, column) {
    return new ErroGoiano(
      'uri',
      'Esse endereço de internet tá todo embrulhado!',
      'Tem caractere esquisito na URL que não consigo entender.',
      line,
      column,
      fileName,
    );
  }

  /**
   * Strategy para RangeError
   * @private
   */
  _translateRangeError(error, fileName, line, column) {
    const originalMessage = error.message;
    let goiasMessage = 'Esse número tá fora do limite, uai!';
    let tip = 'Vê se não tá usando um valor muito grande ou muito pequeno.';

    if (originalMessage.includes('Maximum call stack size exceeded')) {
      goiasMessage = 'O código tá chamando ele mesmo mais que comitiva em festa!';
      tip = 'Ocê tem uma função que tá chamando ela mesma sem parar (recursão infinita).';
    }

    return new ErroGoiano('intervalo', goiasMessage, tip, line, column, fileName);
  }

  /**
   * Strategy para EvalError
   * @private
   */
  _translateEvalError(error, fileName, line, column) {
    return new ErroGoiano(
      'eval',
      'Problema com eval - mas ocê nem deveria usar isso!',
      'Eval é perigoso, sô! Use outras formas de executar código.',
      line,
      column,
      fileName,
    );
  }

  /**
   * Fallback para erros genéricos
   * @private
   */
  _translateGenericError(error, fileName, line, column) {
    return new ErroGoiano(
      'execucao',
      `Erro não identificado: ${error.message}`,
      'Esse tipo de erro é meio cabrero de entender. Tenta ver o que causou ele.',
      line,
      column,
      fileName,
    );
  }
}

module.exports = ErrorTranslator;