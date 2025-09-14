/**
 * GoiásScript Type Analyzer
 * Implements basic type inference for GoiásScript code
 * Provides type checking and warnings in authentic Goiás style
 */

class TypeAnalyzer {
  constructor() {
    // Type inference rules for GoiásScript
    this.typeRules = {
      // Basic types (mais goianos!)
      NUMERO: /^\d+(\.\d+)?$/,
      TEXTO: /^["'].*["']$/,
      BOOLEANO: /^(certeza|de_jeito_nenhum)$/,
      NADA: /^(nada|indefinido|null|undefined)$/,
      
      // Function patterns (mais goianos!)
      FAZ_TREM: /^faz_trem\s+\w+\s*\(/,
      VAI_NA_FRENTE_FAZ_TREM: /^vai_na_frente_faz_trem\s+\w+\s*\(/,
      
      // Object patterns (mais goianos!)  
      COISA: /^{\s*[\w"']+\s*:/,
      LISTA: /^\s*\[/,
    };

    // Variable symbol table for type tracking
    this.symbolTable = new Map();
    
    // Type warnings and errors
    this.warnings = [];
    this.errors = [];
  }

  /**
   * Analyzes code and infers types
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - File name for error reporting
   * @returns {Object} Analysis result with types and warnings
   */
  analyze(code, fileName = 'script.gs') {
    this.fileName = fileName;
    this.warnings = [];
    this.errors = [];
    this.symbolTable.clear();

    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      this._analyzeLine(line.trim(), index + 1);
    });

    return {
      symbolTable: Object.fromEntries(this.symbolTable),
      warnings: this.warnings,
      errors: this.errors,
      hasTypeErrors: this.errors.length > 0,
      typeCount: this.symbolTable.size,
    };
  }

  /**
   * Analyzes a single line for type information
   * @private
   */
  _analyzeLine(line, lineNumber) {
    if (!line || line.startsWith('//')) return;

    // Variable declarations: uai x é 42 or uai x: numero é 42
    const varDeclaration = line.match(/^(uai|trem)\s+(\w+)(?:\s*:\s*(\w+))?\s+é\s+(.+)$/);
    if (varDeclaration) {
      const [, declarationType, varName, explicitType, value] = varDeclaration;
      const inferredType = this._inferType(value);
      const finalType = explicitType ? this._mapGoiasTypeToInternal(explicitType) : inferredType;
      
      // Type checking for explicit annotations
      if (explicitType && inferredType !== 'UNKNOWN') {
        const expectedType = this._mapGoiasTypeToInternal(explicitType);
        if (!this.isTypeCompatible(expectedType, inferredType)) {
          this._addWarning(
            'type_annotation_mismatch',
            `Ô rapaz! Ocê disse que '${varName}' é ${this._getGoiasTypeName(expectedType)}, mas o valor é ${this._getGoiasTypeName(inferredType)}!`,
            'Vê se não tá confundindo o tipo ou se o valor tá certo.',
            lineNumber
          );
        }
      }
      
      this._addSymbol(varName, {
        type: finalType,
        declarationType: declarationType === 'uai' ? 'const' : 'var',
        line: lineNumber,
        value: value.trim(),
        explicitType: explicitType || null,
      });

      // Check for const reassignment (only if variable already exists)
      if (this.symbolTable.has(varName)) {
        const existingSymbol = this.symbolTable.get(varName);
        if (existingSymbol.declarationType === 'const') {
          this._addWarning(
            'const_reassignment',
            `Ô sô! Ocê tá tentando mudar '${varName}' que é uma constante (uai)!`,
            'Use "trem" se ocê quer uma variável que pode mudar.',
            lineNumber
          );
          return; // Don't process further
        }
      }
      return;
    }

    // Function declarations: faz_trem minhaFuncao(params)
    const funcDeclaration = line.match(/^(vai_na_frente_)?faz_trem\s+(\w+)\s*\(([^)]*)\)/);
    if (funcDeclaration) {
      const [, isAsync, funcName, params] = funcDeclaration;
      const paramTypes = this._analyzeParameters(params);
      
      this._addSymbol(funcName, {
        type: 'FUNCTION',
        async: !!isAsync,
        parameters: paramTypes,
        line: lineNumber,
      });
      return;
    }

    // Assignment: x é novoValor
    const assignment = line.match(/^(\w+)\s+é\s+(.+)$/);
    if (assignment) {
      const [, varName, value] = assignment;
      const inferredType = this._inferType(value);
      
      if (this.symbolTable.has(varName)) {
        const existingSymbol = this.symbolTable.get(varName);
        
        // Type compatibility check
        if (existingSymbol.type !== inferredType && 
            existingSymbol.type !== 'UNKNOWN' && 
            inferredType !== 'UNKNOWN') {
          
          this._addWarning(
            'type_mismatch',
            `Ô uai! '${varName}' era ${this._getGoiasTypeName(existingSymbol.type)} e agora virou ${this._getGoiasTypeName(inferredType)}!`,
            'Vê se não tá confundindo os tipos das variáveis.',
            lineNumber
          );
        }

        // Update symbol type
        existingSymbol.type = inferredType;
        existingSymbol.lastAssignment = lineNumber;
      } else {
        this._addWarning(
          'undeclared_variable',
          `Rapaz! '${varName}' não foi declarado, mas tá sendo usado.`,
          'Declare com "uai" ou "trem" antes de usar.',
          lineNumber
        );
      }
    }

    // Function calls for type checking
    const functionCall = line.match(/(\w+)\s*\(/);
    if (functionCall) {
      const [, funcName] = functionCall;
      // Also check for chained method calls like Math.random()
      const isChainedCall = line.includes('.');
      if (!this.symbolTable.has(funcName) && !this._isBuiltinFunction(funcName) && !isChainedCall) {
        this._addWarning(
          'undefined_function',
          `Eita sô! A função '${funcName}' não tá declarada por aqui não.`,
          'Vê se num errou o nome ou se esqueceu de declarar ela antes, uai.',
          lineNumber
        );
      }
    }
  }

  /**
   * Infers type from a value
   * @private
   */
  _inferType(value) {
    value = value.trim();

    // Check each type rule (usando nomes goianos)
    if (this.typeRules.NUMERO.test(value)) return 'NUMERO';
    if (this.typeRules.TEXTO.test(value)) return 'TEXTO';
    if (this.typeRules.BOOLEANO.test(value)) return 'BOOLEANO';
    if (this.typeRules.NADA.test(value)) return 'NADA';
    if (this.typeRules.LISTA.test(value)) return 'LISTA';
    if (this.typeRules.COISA.test(value)) return 'COISA';

    // Function expressions (goiano)
    if (value.includes('faz_trem')) return 'FAZ_TREM';
    
    // Variable reference
    if (this.symbolTable.has(value)) {
      return this.symbolTable.get(value).type;
    }

    // Binary operations - infer from context
    const binaryOp = value.match(/(\w+)\s+(mais|menos|vezes|dividido)\s+(\w+)/);
    if (binaryOp) {
      const [, left, op, right] = binaryOp;
      const leftType = this.symbolTable.get(left)?.type || this._inferType(left);
      const rightType = this.symbolTable.get(right)?.type || this._inferType(right);
      
      if (leftType === 'NUMERO' && rightType === 'NUMERO') return 'NUMERO';
      if (op === 'mais' && (leftType === 'TEXTO' || rightType === 'TEXTO')) return 'TEXTO';
    }

    return 'UNKNOWN';
  }

  /**
   * Analyzes function parameters
   * @private
   */
  _analyzeParameters(paramsString) {
    if (!paramsString.trim()) return [];

    return paramsString.split(',').map(param => {
      const trimmed = param.trim();
      // Check for type annotations: nome: texto
      const typed = trimmed.match(/(\w+)\s*:\s*(\w+)/);
      if (typed) {
        const [, name, type] = typed;
        return { name, type: this._mapGoiasTypeToInternal(type) };
      }
      
      return { name: trimmed, type: 'UNKNOWN' };
    });
  }

  /**
   * Maps GoiásScript type names to internal types
   * @private
   */
  _mapGoiasTypeToInternal(goiasType) {
    const typeMap = {
      'numero': 'NUMERO',
      'texto': 'TEXTO', 
      'booleano': 'BOOLEANO',
      'lista': 'LISTA',
      'coisa': 'COISA',
      'faz_trem': 'FAZ_TREM',
      'nada': 'NADA',
    };
    
    return typeMap[goiasType] || 'DESCONHECIDO';
  }

  /**
   * Gets user-friendly Goiás type name
   * @private
   */
  _getGoiasTypeName(internalType) {
    const nameMap = {
      'NUMERO': 'número',
      'TEXTO': 'texto',
      'BOOLEANO': 'booleano',
      'LISTA': 'lista',
      'COISA': 'coisa',
      'FAZ_TREM': 'função',
      'NADA': 'nada',
      'DESCONHECIDO': 'trem desconhecido',
    };
    
    return nameMap[internalType] || 'trem estranho';
  }

  /**
   * Checks if function is a built-in
   * @private
   */
  _isBuiltinFunction(name) {
    const builtins = [
      'prosa', 'reclama', 'setTimeout', 'setInterval', 
      'parseInt', 'parseFloat', 'JSON', 'Math', 'Date'
    ];
    return builtins.includes(name);
  }

  /**
   * Adds symbol to table
   * @private
   */
  _addSymbol(name, info) {
    this.symbolTable.set(name, info);
  }

  /**
   * Adds warning in Goiás style
   * @private
   */
  _addWarning(type, message, suggestion, line) {
    this.warnings.push({
      type,
      message: `⚠️  ${message}`,
      suggestion: `💡 Dica: ${suggestion}`,
      line,
      file: this.fileName,
    });
  }

  /**
   * Adds error in Goiás style
   * @private
   */
  _addError(type, message, suggestion, line) {
    this.errors.push({
      type,
      message: `❌ ${message}`,
      suggestion: `💡 Dica: ${suggestion}`,
      line,
      file: this.fileName,
    });
  }

  /**
   * Gets type information for a variable
   * @param {string} varName - Variable name
   * @returns {Object|null} Type information
   */
  getVariableType(varName) {
    return this.symbolTable.get(varName) || null;
  }

  /**
   * Validates type compatibility between two types
   * @param {string} expected - Expected type
   * @param {string} actual - Actual type
   * @returns {boolean} Whether types are compatible
   */
  isTypeCompatible(expected, actual) {
    if (expected === actual) return true;
    if (expected === 'UNKNOWN' || actual === 'UNKNOWN') return true;
    
    // String concatenation compatibility
    if (expected === 'STRING' && actual === 'NUMBER') return true;
    if (expected === 'NUMBER' && actual === 'STRING') {
      // Only compatible if string looks like a number
      return /^\d+(\.\d+)?$/.test(actual);
    }
    
    return false;
  }
}

module.exports = TypeAnalyzer;