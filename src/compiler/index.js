const GoiasScriptTranspiler = require('./simpleTranspiler');
const GoiasScriptLexer = require('./lexer');

/**
 * Entry point principal do compilador GoiásScript
 * Implementa Facade Pattern para simplificar a interface
 */
class GoiasScriptCompiler {
  constructor(options = {}) {
    this.transpiler = new GoiasScriptTranspiler(options);
    this.lexer = new GoiasScriptLexer();
    this.options = options;
  }

  /**
   * Compila código GoiásScript
   * @param {string} codigo - Código fonte
   * @param {string} nomeArquivo - Nome do arquivo (opcional)
   * @returns {Object} Resultado da compilação
   */
  compile(codigo, nomeArquivo = 'script.gs') {
    try {
      const resultado = this.transpiler.transpile(codigo, nomeArquivo);
      
      if (!resultado.success) {
        return resultado;
      }

      return {
        success: true,
        javascript: resultado.code,
        sourceMap: resultado.sourceMap,
        warnings: resultado.warnings || [],
        stats: this._getCompilationStats(codigo, resultado.code),
      };

    } catch (error) {
      return {
        success: false,
        error: error,
        javascript: null,
      };
    }
  }

  /**
   * Executa código GoiásScript diretamente
   * @param {string} codigo - Código fonte
   * @param {string} nomeArquivo - Nome do arquivo (opcional)
   * @returns {Promise} Resultado da execução
   */
  async execute(codigo, nomeArquivo = 'script.gs') {
    const resultado = this.compile(codigo, nomeArquivo);
    
    if (!resultado.success) {
      if (resultado.error && resultado.error.mostrarErro) {
        resultado.error.mostrarErro();
      } else {
        console.error('Erro na compilação:', resultado.error);
      }
      return;
    }

    try {
      // Criar contexto isolado para execução
      const context = this._createExecutionContext();
      
      // Executar código JavaScript gerado
      const func = new Function(...Object.keys(context), resultado.javascript);
      await func(...Object.values(context));
      
    } catch (error) {
      const erroGoiano = this.transpiler.errorTranslator.traduzir(error, nomeArquivo);
      erroGoiano.mostrarErro();
    }
  }

  /**
   * Apenas transpila sem executar
   * @param {string} codigo - Código fonte
   * @param {string} nomeArquivo - Nome do arquivo (opcional)
   * @returns {string|null} Código JavaScript ou null em caso de erro
   */
  transpileOnly(codigo, nomeArquivo = 'script.gs') {
    const resultado = this.compile(codigo, nomeArquivo);
    return resultado.success ? resultado.javascript : null;
  }

  /**
   * Valida sintaxe sem executar
   * @param {string} codigo - Código fonte
   * @returns {Object} Resultado da validação
   */
  validate(codigo) {
    try {
      const tokens = this.lexer.tokenize(codigo);
      const resultado = this.transpiler.transpile(codigo, 'validation.gs');
      
      return {
        valid: resultado.success,
        tokens: tokens,
        errors: resultado.success ? [] : [resultado.error],
        warnings: resultado.warnings || [],
      };
    } catch (error) {
      return {
        valid: false,
        tokens: [],
        errors: [error],
        warnings: [],
      };
    }
  }

  /**
   * Cria contexto de execução com funções auxiliares
   * @private
   * @returns {Object} Contexto de execução
   */
  _createExecutionContext() {
    return {
      // Funções globais do GoiásScript
      vixeGoiano: (mensagem, tipo = 'execucao', dica = null) => {
        const ErroGoiano = require('../errors/ErroGoiano');
        throw new ErroGoiano(tipo, mensagem, dica);
      },
      
      // Utilitários para debug
      __debug: (message) => {
        if (this.options.debug) {
          console.log('[DEBUG GoiásScript]:', message);
        }
      },
      
      // Promessas customizadas (se necessário)
      promessa: Promise,
      
      // Console com estilo goiano
      console: console,
      
      // Outros utilitários globais
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,
      
      // Módulos Node.js comuns (se em ambiente Node)
      ...(typeof require !== 'undefined' ? {
        require: require,
        module: module,
        exports: exports,
        __filename: __filename,
        __dirname: __dirname,
      } : {}),
    };
  }

  /**
   * Gera estatísticas da compilação
   * @private
   * @param {string} originalCode - Código original
   * @param {string} compiledCode - Código compilado
   * @returns {Object} Estatísticas
   */
  _getCompilationStats(originalCode, compiledCode) {
    return {
      originalSize: originalCode.length,
      compiledSize: compiledCode.length,
      originalLines: originalCode.split('\n').length,
      compiledLines: compiledCode.split('\n').length,
      compressionRatio: compiledCode.length / originalCode.length,
      timestamp: new Date().toISOString(),
    };
  }
}

module.exports = GoiasScriptCompiler;