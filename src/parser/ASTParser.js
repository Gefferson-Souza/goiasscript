/**
 * GoiásScript AST Parser
 * Abstract Syntax Tree parser for advanced optimizations
 * Fase 5: Performance & Otimização
 */

class GoianoASTParser {
  constructor() {
    this.tokens = [];
    this.position = 0;
    this.currentToken = null;
  }

  /**
   * Parseia código GoiásScript em AST
   * @param {string} code - Código GoiásScript
   * @returns {Object} AST (Abstract Syntax Tree)
   */
  parse(code) {
    this.tokens = this._tokenize(code);
    this.position = 0;
    this.currentToken = this.tokens[0];
    
    return this._parseProgram();
  }

  /**
   * Tokeniza o código
   * @private
   */
  _tokenize(code) {
    const tokenPatterns = [
      { type: 'COMMENT', pattern: /\/\/.*$|\/\*[\s\S]*?\*\//m },
      { type: 'STRING', pattern: /"([^"\\]|\\.)*"|'([^'\\]|\\.)*'/ },
      { type: 'NUMBER', pattern: /\d+(\.\d+)?/ },
      { type: 'IDENTIFIER', pattern: /[a-zA-Z_$][a-zA-Z0-9_$]*/ },
      { type: 'OPERATOR', pattern: /[+\-*/%=<>!&|]+/ },
      { type: 'DELIMITER', pattern: /[(){}[\];,.]/ },
      { type: 'WHITESPACE', pattern: /\s+/ }
    ];

    const tokens = [];
    const lines = code.split('\n');
    
    lines.forEach((line, lineNumber) => {
      let position = 0;
      
      while (position < line.length) {
        let matched = false;
        
        for (const { type, pattern } of tokenPatterns) {
          const regex = new RegExp(`^${pattern.source}`, pattern.flags);
          const match = line.slice(position).match(regex);
          
          if (match) {
            if (type !== 'WHITESPACE' && type !== 'COMMENT') {
              tokens.push({
                type,
                value: match[0],
                line: lineNumber + 1,
                column: position + 1
              });
            }
            position += match[0].length;
            matched = true;
            break;
          }
        }
        
        if (!matched) {
          position++; // Skip unknown characters
        }
      }
    });
    
    return tokens;
  }

  /**
   * Parseia programa completo
   * @private
   */
  _parseProgram() {
    const statements = [];
    
    while (this.currentToken) {
      const statement = this._parseStatement();
      if (statement) {
        statements.push(statement);
      }
      this._advance();
    }
    
    return {
      type: 'Program',
      body: statements
    };
  }

  /**
   * Parseia uma declaração
   * @private
   */
  _parseStatement() {
    if (!this.currentToken) return null;
    
    switch (this.currentToken.value) {
      case 'uai':
        return this._parseVariableDeclaration();
      case 'faz_trem':
        return this._parseFunctionDeclaration();
      case 'se':
        return this._parseIfStatement();
      case 'pra':
        return this._parseForStatement();
      case 'enquanto':
        return this._parseWhileStatement();
      default:
        return this._parseExpressionStatement();
    }
  }

  /**
   * Parseia declaração de variável
   * @private
   */
  _parseVariableDeclaration() {
    const node = {
      type: 'VariableDeclaration',
      keyword: this.currentToken.value, // 'uai'
      line: this.currentToken.line
    };
    
    this._advance(); // Skip 'uai'
    
    if (this.currentToken && this.currentToken.type === 'IDENTIFIER') {
      node.identifier = this.currentToken.value;
      this._advance();
      
      // Check for type annotation
      if (this.currentToken && this.currentToken.value === ':') {
        this._advance(); // Skip ':'
        if (this.currentToken && this.currentToken.type === 'IDENTIFIER') {
          node.typeAnnotation = this.currentToken.value;
          this._advance();
        }
      }
      
      // Check for assignment
      if (this.currentToken && this.currentToken.value === 'é') {
        this._advance(); // Skip 'é'
        node.init = this._parseExpression();
      }
    }
    
    return node;
  }

  /**
   * Parseia declaração de função
   * @private
   */
  _parseFunctionDeclaration() {
    const node = {
      type: 'FunctionDeclaration',
      keyword: this.currentToken.value, // 'faz_trem'
      line: this.currentToken.line
    };
    
    this._advance(); // Skip 'faz_trem'
    
    if (this.currentToken && this.currentToken.type === 'IDENTIFIER') {
      node.name = this.currentToken.value;
      this._advance();
      
      // Parse parameters
      if (this.currentToken && this.currentToken.value === '(') {
        node.params = this._parseParameters();
      }
      
      // Parse return type
      if (this.currentToken && this.currentToken.value === ':') {
        this._advance(); // Skip ':'
        if (this.currentToken && this.currentToken.type === 'IDENTIFIER') {
          node.returnType = this.currentToken.value;
          this._advance();
        }
      }
      
      // Parse body
      if (this.currentToken && this.currentToken.value === '{') {
        node.body = this._parseBlockStatement();
      }
    }
    
    return node;
  }

  /**
   * Parseia parâmetros de função
   * @private
   */
  _parseParameters() {
    const params = [];
    this._advance(); // Skip '('
    
    while (this.currentToken && this.currentToken.value !== ')') {
      if (this.currentToken.type === 'IDENTIFIER') {
        const param = { name: this.currentToken.value };
        this._advance();
        
        // Type annotation
        if (this.currentToken && this.currentToken.value === ':') {
          this._advance(); // Skip ':'
          if (this.currentToken && this.currentToken.type === 'IDENTIFIER') {
            param.type = this.currentToken.value;
            this._advance();
          }
        }
        
        params.push(param);
        
        if (this.currentToken && this.currentToken.value === ',') {
          this._advance(); // Skip ','
        }
      } else {
        this._advance();
      }
    }
    
    if (this.currentToken && this.currentToken.value === ')') {
      this._advance(); // Skip ')'
    }
    
    return params;
  }

  /**
   * Parseia bloco de código
   * @private
   */
  _parseBlockStatement() {
    const statements = [];
    this._advance(); // Skip '{'
    
    while (this.currentToken && this.currentToken.value !== '}') {
      const statement = this._parseStatement();
      if (statement) {
        statements.push(statement);
      }
      this._advance();
    }
    
    if (this.currentToken && this.currentToken.value === '}') {
      this._advance(); // Skip '}'
    }
    
    return {
      type: 'BlockStatement',
      body: statements
    };
  }

  /**
   * Parseia expressão
   * @private
   */
  _parseExpression() {
    // Simplified expression parsing
    const expression = {
      type: 'Expression',
      value: this.currentToken ? this.currentToken.value : null,
      line: this.currentToken ? this.currentToken.line : 0
    };
    
    return expression;
  }

  /**
   * Parseia statement de expressão
   * @private
   */
  _parseExpressionStatement() {
    return {
      type: 'ExpressionStatement',
      expression: this._parseExpression(),
      line: this.currentToken ? this.currentToken.line : 0
    };
  }

  /**
   * Parseia if statement
   * @private
   */
  _parseIfStatement() {
    const node = {
      type: 'IfStatement',
      line: this.currentToken.line
    };
    
    this._advance(); // Skip 'se'
    
    if (this.currentToken && this.currentToken.value === '(') {
      this._advance(); // Skip '('
      node.test = this._parseExpression();
      
      // Skip until ')'
      while (this.currentToken && this.currentToken.value !== ')') {
        this._advance();
      }
      if (this.currentToken && this.currentToken.value === ')') {
        this._advance(); // Skip ')'
      }
    }
    
    if (this.currentToken && this.currentToken.value === '{') {
      node.consequent = this._parseBlockStatement();
    }
    
    return node;
  }

  /**
   * Parseia for statement
   * @private
   */
  _parseForStatement() {
    return {
      type: 'ForStatement',
      line: this.currentToken ? this.currentToken.line : 0
    };
  }

  /**
   * Parseia while statement
   * @private
   */
  _parseWhileStatement() {
    return {
      type: 'WhileStatement',
      line: this.currentToken ? this.currentToken.line : 0
    };
  }

  /**
   * Avança para o próximo token
   * @private
   */
  _advance() {
    this.position++;
    this.currentToken = this.tokens[this.position] || null;
  }

  /**
   * Analisa AST para otimizações
   * @param {Object} ast - AST tree
   * @returns {Object} Análise de otimizações
   */
  analyzeForOptimizations(ast) {
    const analysis = {
      functions: [],
      variables: [],
      loops: [],
      hotPaths: [],
      complexityScore: 0
    };

    this._traverseAST(ast, (node) => {
      switch (node.type) {
        case 'FunctionDeclaration':
          analysis.functions.push({
            name: node.name,
            line: node.line,
            paramCount: node.params ? node.params.length : 0
          });
          break;
        case 'VariableDeclaration':
          analysis.variables.push({
            name: node.identifier,
            line: node.line,
            hasType: !!node.typeAnnotation
          });
          break;
        case 'ForStatement':
        case 'WhileStatement':
          analysis.loops.push({
            type: node.type,
            line: node.line
          });
          analysis.complexityScore += 2;
          break;
        case 'IfStatement':
          analysis.complexityScore += 1;
          break;
      }
    });

    return analysis;
  }

  /**
   * Atravessa AST executando callback
   * @private
   */
  _traverseAST(node, callback) {
    if (!node) return;
    
    callback(node);
    
    if (node.body) {
      if (Array.isArray(node.body)) {
        node.body.forEach(child => this._traverseAST(child, callback));
      } else {
        this._traverseAST(node.body, callback);
      }
    }
    
    if (node.consequent) {
      this._traverseAST(node.consequent, callback);
    }
    
    if (node.alternate) {
      this._traverseAST(node.alternate, callback);
    }
  }
}

module.exports = GoianoASTParser;