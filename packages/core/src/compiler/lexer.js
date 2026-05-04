/**
 * Lexer (Analisador Léxico) do GoiásScript
 * Responsável por quebrar o código fonte em tokens
 */
class GoiasScriptLexer {
  constructor() {
    // Mapeamento de palavras-chave GoiásScript -> JavaScript
    this.keywords = {
      // Declarações e atribuições
      'uai': 'const',
      'trem': 'var',
      'é': '=',
      'ocê': 'this',
      
      // Classes e objetos
      'arruma_trem': 'class',
      'aprepara_trem': 'constructor',
      'inherda_de': 'extends',
      'é_tipo_de': 'instanceof',
      'num_muda': 'static',
      
      // Estruturas de controle
      'se_ocê_quiser': 'if',
      'se_num_for': 'else if',
      'se_não': 'else',
      'vai_indo': 'for',
      'enquanto_tiver': 'while',
      'para_com_isso': 'break',
      'continua_aí': 'continue',
      
      // Funções
      'presta_serviço': 'function',
      'faz_favor': 'return',
      'vai_na_frente': 'async',
      'espera_um_cadim': 'await',
      
      // Operadores lógicos
      'e_mais': '&&',
      'ou_então': '||',
      'num_é': '!',
      'é_igualim': '===',
      'diferente': '!==',
      'maior_que': '>',
      'menor_que': '<',
      'pelo_menos': '>=',
      'no_máximo': '<=',
      
      // Operações aritméticas
      'mais': '+',
      'menos': '-',
      'vezes': '*',
      'dividido': '/',
      'sobrou': '%',
      
      // Console e controle
      'prosa': 'console.log',
      'reclama': 'console.error',
      'vixe': 'throw new Error',
      
      // Tipos e valores
      'vazio': 'null',
      'sei_lá': 'undefined',
      'certeza': 'true',
      'de_jeito_nenhum': 'false',
      
      // Loop específicos
      'em': 'in',
      'de': 'of',
      
      // Promises e async
      'promessa': 'Promise',
      'quando_resolver': 'then',
      'se_der_pobrema': 'catch',
      'resolve_aí': 'resolve',
      'rejeita_isso': 'reject',
      
      // Try/catch
      'tenta_aí': 'try',
      'se_der_ruim': 'catch',
      'por_fim': 'finally',
      
      // Outros
      'faz_um': 'new',
    };

    // Mapeamentos especiais que precisam de tratamento diferenciado
    this.specialMappings = [
      // Funções assíncronas
      { from: /vai_na_frente_presta_serviço/g, to: 'async function' },
      
      // Construtores e métodos
      { from: /aprepara_trem\s*\(/g, to: 'constructor(' },
      
      // Modificadores de acesso (para futuro)
      { from: /ninguem_fuça\s+/g, to: 'private ' },
      { from: /só_da_famia\s+/g, to: 'protected ' },
      { from: /todo_mundo_vê\s+/g, to: 'public ' },
    ];
  }

  /**
   * Tokeniza o código GoiásScript
   * @param {string} codigo - Código fonte em GoiásScript
   * @returns {Array} Array de tokens
   */
  tokenize(codigo) {
    const tokens = [];
    const lines = codigo.split('\n');
    
    for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
      const line = lines[lineNumber];
      const lineTokens = this._tokenizeLine(line, lineNumber + 1);
      tokens.push(...lineTokens);
    }
    
    return tokens;
  }

  /**
   * Tokeniza uma única linha
   * @private
   * @param {string} line - Linha de código
   * @param {number} lineNumber - Número da linha
   * @returns {Array} Tokens da linha
   */
  _tokenizeLine(line, lineNumber) {
    const tokens = [];
    let position = 0;
    
    // Remover comentários
    const commentIndex = line.indexOf('//');
    const codeLine = commentIndex !== -1 ? line.substring(0, commentIndex) : line;
    
    if (codeLine.trim() === '') {
      return tokens;
    }
    
    // Regex para identificar tokens
    const tokenRegex = /(\w+|[^\w\s])/g;
    let match;
    
    while ((match = tokenRegex.exec(codeLine)) !== null) {
      const value = match[1];
      const column = match.index + 1;
      
      const token = {
        type: this._getTokenType(value),
        value: value,
        jsValue: this.keywords[value] || value,
        position: {
          line: lineNumber,
          column: column,
        },
      };
      
      tokens.push(token);
      position = tokenRegex.lastIndex;
    }
    
    return tokens;
  }

  /**
   * Determina o tipo do token
   * @private
   * @param {string} value - Valor do token
   * @returns {string} Tipo do token
   */
  _getTokenType(value) {
    if (this.keywords[value]) {
      return 'KEYWORD';
    }
    
    if (/^\d+(\.\d+)?$/.test(value)) {
      return 'NUMBER';
    }
    
    if (/^["'].*["']$/.test(value)) {
      return 'STRING';
    }
    
    if (/^[a-zA-Z_]\w*$/.test(value)) {
      return 'IDENTIFIER';
    }
    
    if (/^[+\-*/%=<>!&|()]$/.test(value)) {
      return 'OPERATOR';
    }
    
    if (/^[{}[\],;]$/.test(value)) {
      return 'DELIMITER';
    }
    
    return 'UNKNOWN';
  }

  /**
   * Converte tokens para JavaScript
   * @param {Array} tokens - Array de tokens
   * @returns {string} Código JavaScript
   */
  tokensToJS(tokens) {
    return tokens.map(token => token.jsValue).join(' ');
  }
}

module.exports = GoiasScriptLexer;