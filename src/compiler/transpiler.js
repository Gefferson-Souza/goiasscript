const GoiasScriptLexer = require('./lexer');
const ErrorTranslator = require('../errors/errorTranslator');

/**
 * Transpiler principal do GoiásScript
 * Converte código GoiásScript para JavaScript
 * Implementa Factory Pattern para criar diferentes tipos de saída
 */
class GoiasScriptTranspiler {
  constructor(options = {}) {
    this.lexer = new GoiasScriptLexer();
    this.errorTranslator = new ErrorTranslator();
    this.options = {
      sourceMap: false,
      minify: false,
      target: 'es2018',
      ...options,
    };
  }

  /**
   * Transpila código GoiásScript para JavaScript
   * @param {string} codigo - Código fonte GoiásScript
   * @param {string} nomeArquivo - Nome do arquivo fonte
   * @returns {Object} Resultado da transpilação
   */
  transpile(codigo, nomeArquivo = 'script.gs') {
    try {
      // Aplicar transformações especiais primeiro
      let codigoTransformado = this._aplicarTransformacoesEspeciais(codigo);
      
      // Aplicar mapeamentos de palavras-chave
      codigoTransformado = this._aplicarMapeamentoPalavrasChave(codigoTransformado);
      
      // Aplicar pós-processamento
      codigoTransformado = this._posProcessamento(codigoTransformado);
      
      return {
        success: true,
        code: codigoTransformado,
        sourceMap: this.options.sourceMap ? this._generateSourceMap(codigo, codigoTransformado) : null,
        warnings: [],
      };
      
    } catch (error) {
      const erroGoiano = this.errorTranslator.traduzir(error, nomeArquivo);
      return {
        success: false,
        error: erroGoiano,
        code: null,
      };
    }
  }

  /**
   * Aplica transformações especiais que não são simples substituições
   * @private
   * @param {string} codigo - Código fonte
   * @returns {string} Código transformado
   */
  _aplicarTransformacoesEspeciais(codigo) {
    let transformed = codigo;

    // Transformações especiais do lexer
    this.lexer.specialMappings.forEach(mapping => {
      transformed = transformed.replace(mapping.from, mapping.to);
    });

    // Tratamento especial para classes e métodos
    transformed = this._transformarClasses(transformed);
    
    // Tratamento para promises
    transformed = this._transformarPromises(transformed);
    
    return transformed;
  }

  /**
   * Transforma definições de classes
   * @private
   * @param {string} codigo - Código a transformar
   * @returns {string} Código transformado
   */
  _transformarClasses(codigo) {
    // Transformar definição de classe com herança
    codigo = codigo.replace(
      /arruma_trem\s+(\w+)\s+inherda_de\s+(\w+)/g,
      'class $1 extends $2'
    );
    
    // Transformar definição de classe simples
    codigo = codigo.replace(
      /arruma_trem\s+(\w+)/g,
      'class $1'
    );
    
    return codigo;
  }

  /**
   * Transforma promises e async/await
   * @private
   * @param {string} codigo - Código a transformar
   * @returns {string} Código transformado
   */
  _transformarPromises(codigo) {
    // Substituir promessa.all por Promise.all
    codigo = codigo.replace(/promessa\.all/g, 'Promise.all');
    
    return codigo;
  }

  /**
   * Aplica mapeamento de palavras-chave
   * @private
   * @param {string} codigo - Código a transformar
   * @returns {string} Código transformado
   */
  _aplicarMapeamentoPalavrasChave(codigo) {
    let transformed = codigo;
    
    // Ordenar palavras-chave por tamanho (maior primeiro) para evitar conflitos
    const sortedKeywords = Object.keys(this.lexer.keywords)
      .sort((a, b) => b.length - a.length);
    
    sortedKeywords.forEach(keyword => {
      const jsEquivalent = this.lexer.keywords[keyword];
      // Usar word boundary para evitar substituições parciais
      const regex = new RegExp(`\\b${keyword}\\b`, 'g');
      transformed = transformed.replace(regex, jsEquivalent);
    });
    
    return transformed;
  }

  /**
   * Aplica pós-processamento para ajustar o código gerado
   * @private
   * @param {string} codigo - Código a processar
   * @returns {string} Código processado
   */
  _posProcessamento(codigo) {
    let processed = codigo;
    
    // Corrigir espaçamento em operadores
    processed = processed.replace(/\s+/g, ' ');
    processed = processed.replace(/\s*([{}();,])\s*/g, '$1 ');
    processed = processed.replace(/([{}();,])\s+$/gm, '$1');
    
    // Adicionar ponto e vírgula onde necessário
    processed = this._adicionarPontoEVirgula(processed);
    
    return processed.trim();
  }

  /**
   * Adiciona ponto e vírgula onde necessário
   * @private
   * @param {string} codigo - Código a processar
   * @returns {string} Código com pontos e vírgulas
   */
  _adicionarPontoEVirgula(codigo) {
    const lines = codigo.split('\n');
    
    return lines.map(line => {
      const trimmed = line.trim();
      
      // Pular linhas vazias, comentários e estruturas que não precisam de ;
      if (!trimmed || 
          trimmed.startsWith('//') || 
          trimmed.startsWith('/*') ||
          trimmed.endsWith('{') ||
          trimmed.endsWith('}') ||
          trimmed.endsWith(';')) {
        return line;
      }
      
      // Não adicionar ; em estruturas de controle
      const controlStructures = [
        'if', 'else', 'for', 'while', 'try', 'catch', 'finally',
        'class', 'function', 'switch', 'case', 'default'
      ];
      
      const startsWithControl = controlStructures.some(structure => 
        trimmed.startsWith(structure + ' ') || trimmed.startsWith(structure + '(')
      );
      
      if (startsWithControl) {
        return line;
      }
      
      // Adicionar ; se necessário
      return line + (trimmed.endsWith(';') ? '' : ';');
    }).join('\n');
  }

  /**
   * Gera source map para debug
   * @private
   * @param {string} originalCode - Código original
   * @param {string} transpiledCode - Código transpilado
   * @returns {Object} Source map
   */
  _generateSourceMap(originalCode, transpiledCode) {
    // Implementação simplificada de source map
    const originalLines = originalCode.split('\n');
    const transpiledLines = transpiledCode.split('\n');
    
    return {
      version: 3,
      sources: ['input.gs'],
      names: [],
      mappings: this._generateMappings(originalLines, transpiledLines),
      sourcesContent: [originalCode],
    };
  }

  /**
   * Gera mapeamentos para source map
   * @private
   * @param {Array} originalLines - Linhas originais
   * @param {Array} transpiledLines - Linhas transpiladas
   * @returns {string} Mapeamentos codificados
   */
  _generateMappings(originalLines, transpiledLines) {
    // Implementação simplificada - mapeia linha por linha
    const mappings = [];
    
    for (let i = 0; i < Math.min(originalLines.length, transpiledLines.length); i++) {
      mappings.push(`AAAA`); // Mapeamento básico
    }
    
    return mappings.join(';');
  }
}

module.exports = GoiasScriptTranspiler;