const ErrorTranslator = require('../errors/errorTranslator');
const GoianoBuiltins = require('../goianoMethods/GoianoBuiltins');

/**
 * Transpiler simplificado do GoiásScript
 * Implementa substituições diretas para funcionar imediatamente
 */
class SimpleGoiasScriptTranspiler {
  constructor(options = {}) {
    this.errorTranslator = new ErrorTranslator();
    this.goianoBuiltins = new GoianoBuiltins();
    this.options = options;
  }

  /**
   * Transpiles GoiásScript code to JavaScript
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {Object} Transpilation result
   */
  transpile(code, fileName = 'script.gs') {
    try {
      // Basic syntax validation
      const syntaxErrors = this._validateSyntax(code);
      if (syntaxErrors.length > 0) {
        return {
          success: false,
          error: syntaxErrors[0],
          code: null,
        };
      }

      let jsCode = code;

      // Apply all substitutions
      jsCode = this._applySubstitutions(jsCode);
      
      // Check for forbidden non-Goiano methods
      const warnings = this._checkForbiddenMethods(jsCode);
      
      // Add Goiano builtin methods at the beginning
      const goianoRuntime = this.goianoBuiltins.gerarImplementacaoGoiana();
      jsCode = goianoRuntime + '\n\n' + jsCode;
      
      // Generate simple tokens for validation
      const tokens = this._generateTokens(code);
      
      return {
        success: true,
        code: jsCode,
        warnings: warnings,
        tokens: tokens,
      };
      
    } catch (error) {
      const goiasError = this.errorTranslator.translate(error, fileName);
      return {
        success: false,
        error: goiasError,
        code: null,
      };
    }
  }

  /**
   * Apply all necessary substitutions
   * @private
   */
  _applySubstitutions(code) {
    let result = code;

    // First, protect strings from being modified
    const stringPlaceholders = [];
    let stringIndex = 0;
    
    // Replace strings temporarily
    result = result.replace(/(['"])((?:(?!\1)[^\\]|\\.)*)(\1)/g, (match) => {
      const placeholder = `__STRING_${stringIndex++}__`;
      stringPlaceholders.push({placeholder, original: match});
      return placeholder;
    });

    // Convert forbidden JS methods to Goiano methods first
    result = this._convertJSMethodsToGoiano(result);
    
    // Remove type annotations for JavaScript output
    result = this._removeTypeAnnotations(result);

    // Direct mappings ordered by size (largest first)
    const mappings = [
      // Async functions first
      ['vai_na_frente_faz_trem', 'async function'],
      
      // Compound operators with 'é' first
      ['é_tipo_de', 'instanceof'],
      ['é_igualim', '==='],
      
      // Classes and inheritance
      ['arruma_trem', 'class'],
      ['inherda_de', 'extends'],
      ['aprepara_trem', 'constructor'],
      ['num_muda', 'static'],
      
      // Control structures
      ['se_ocê_quiser', 'if'],
      ['se_num_for', 'else if'],
      ['se_não', 'else'],
      ['vai_indo', 'for'],
      ['enquanto_tiver', 'while'],
      ['para_com_isso', 'break'],
      ['continua_aí', 'continue'],
      
      // Functions
      ['faz_trem', 'function'],
      ['faz_favor', 'return'],
      ['vai_na_frente', 'async'],
      ['espera_um_cadim', 'await'],
      
      // Logical operators (é_igualim already above)
      ['diferente', '!=='],
      ['maior_que', '>'],
      ['menor_que', '<'],
      ['pelo_menos', '>='],
      ['no_máximo', '<='],
      ['e_mais', '&&'],
      ['ou_então', '||'],
      ['num_é', '!'],
      
      // Arithmetic operators
      ['mais', '+'],
      ['menos', '-'],
      ['vezes', '*'],
      ['dividido', '/'],
      ['sobrou', '%'],
      
      // Console and control
      ['prosa', 'console.log'],
      ['reclama', 'console.error'],
      
      // Promises
      ['promessa', 'Promise'],
      ['quando_resolver', 'then'],
      ['se_der_pobrema', 'catch'],
      ['resolve_aí', 'resolve'],
      ['rejeita_isso', 'reject'],
      
      // Try/catch
      ['tenta_aí', 'try'],
      ['se_der_ruim', 'catch'],
      ['por_fim', 'finally'],
      
      // Types (mais goianos!)
      ['certeza', 'true'],
      ['de_jeito_nenhum', 'false'], 
      ['nada', 'null'],
      ['indefinido', 'undefined'],
      
      // Other simple words
      ['ocê', 'this'],
      ['faz_um', 'new'],
      ['vixe', 'throw new Error'],
      ['rejeita_isso', 'reject'],
      ['resolve_aí', 'resolve'],
      
      // Loop keywords
      ['em', 'in'],
      ['de', 'of'],
      
      // Declarations - 'é' needs to come before compound operators
      ['trem', 'var'],
      ['uai', 'const'],
      ['é', '='],
    ];

    // Apply each mapping
    mappings.forEach(([goiasWord, jsWord]) => {
      // For accented words, use a more specific approach
      if (goiasWord === 'é') {
        // Handle 'é' specially - must be between spaces
        result = result.replace(/\s+é\s+/g, ' = ');
      } else if (goiasWord === 'ocê') {
        // Handle 'ocê' which can be followed by dot or at beginning
        result = result.replace(/(^|\s)ocê(\s|\.)/g, '$1this$2');
      } else if (goiasWord.includes('_') || /[àáâãçéêí]/.test(goiasWord)) {
        // Words with underscore or accents need special treatment
        // Include common punctuation as delimiters
        const wordRegex = new RegExp(
          `(^|\\s|\\(|,|\\.)${this._escapeRegex(goiasWord)}(\\s|$|\\)|,|\\()`,
          'g',
        );
        result = result.replace(wordRegex, `$1${jsWord}$2`);
      } else {
        // Use word boundary to avoid partial substitutions
        const boundaryRegex = new RegExp(`\\b${this._escapeRegex(goiasWord)}\\b`, 'g');
        result = result.replace(boundaryRegex, jsWord);
      }
    });

    // Restore original strings
    stringPlaceholders.forEach(({placeholder, original}) => {
      result = result.replace(placeholder, original);
    });

    return result;
  }

  /**
   * Remove type annotations from GoiásScript code for JavaScript compatibility
   * @private
   */
  _removeTypeAnnotations(code) {
    // Remove type annotations like: uai nome: texto é "value"
    // Convert to: uai nome é "value"
    return code.replace(/(uai|trem)\s+(\w+)\s*:\s*\w+\s+(é)/g, '$1 $2 $3');
  }

  /**
   * Convert JavaScript methods to Goiano methods
   * @private
   */
  _convertJSMethodsToGoiano(code) {
    let result = code;
    
    // Convert JS methods to Goiano equivalents
    const jsToGoiano = this.goianoBuiltins.metodosGoianos;
    
    // String methods
    result = result.replace(/\.replace\s*\(/g, '.trocar(');
    result = result.replace(/\.split\s*\(/g, '.dividir(');
    result = result.replace(/\.join\s*\(/g, '.juntar(');
    result = result.replace(/\.toUpperCase\s*\(\)/g, '.pra_maiusculo()');
    result = result.replace(/\.toLowerCase\s*\(\)/g, '.pra_minusculo()');
    result = result.replace(/\.trim\s*\(\)/g, '.aparar()');
    result = result.replace(/\.includes\s*\(/g, '.contem(');
    result = result.replace(/\.indexOf\s*\(/g, '.posicao_de(');
    result = result.replace(/\.substring\s*\(/g, '.pedaco(');
    result = result.replace(/\.slice\s*\(/g, '.fatiar(');
    result = result.replace(/\.charAt\s*\(/g, '.letra_em(');
    result = result.replace(/\.length\b/g, '.tamanho()');
    result = result.replace(/\.startsWith\s*\(/g, '.comeca_com(');
    result = result.replace(/\.endsWith\s*\(/g, '.termina_com(');
    
    // Array methods
    result = result.replace(/\.map\s*\(/g, '.mapear(');
    result = result.replace(/\.filter\s*\(/g, '.filtrar(');
    result = result.replace(/\.reduce\s*\(/g, '.reduzir(');
    result = result.replace(/\.forEach\s*\(/g, '.pra_cada(');
    result = result.replace(/\.push\s*\(/g, '.empurrar(');
    result = result.replace(/\.pop\s*\(\)/g, '.tirar_ultimo()');
    result = result.replace(/\.shift\s*\(\)/g, '.tirar_primeiro()');
    result = result.replace(/\.unshift\s*\(/g, '.por_primeiro(');
    result = result.replace(/\.sort\s*\(/g, '.ordenar(');
    result = result.replace(/\.reverse\s*\(\)/g, '.inverter()');
    result = result.replace(/\.find\s*\(/g, '.achar(');
    result = result.replace(/\.concat\s*\(/g, '.juntar_lista(');
    result = result.replace(/\.splice\s*\(/g, '.emendar(');
    
    // Object methods
    result = result.replace(/Object\.keys\s*\(/g, 'Object.chaves(');
    result = result.replace(/Object\.values\s*\(/g, 'Object.valores(');
    result = result.replace(/Object\.entries\s*\(/g, 'Object.entradas(');
    result = result.replace(/\.hasOwnProperty\s*\(/g, '.tem_propriedade(');
    result = result.replace(/Object\.assign\s*\(/g, 'Object.misturar(');
    
    // Math methods
    result = result.replace(/Math\.random\s*\(\)/g, 'GoianoMath.sorteio()');
    result = result.replace(/Math\.floor\s*\(/g, 'GoianoMath.arredondar_baixo(');
    result = result.replace(/Math\.ceil\s*\(/g, 'GoianoMath.arredondar_cima(');
    result = result.replace(/Math\.round\s*\(/g, 'GoianoMath.arredondar(');
    result = result.replace(/Math\.max\s*\(/g, 'GoianoMath.maior(');
    result = result.replace(/Math\.min\s*\(/g, 'GoianoMath.menor(');
    result = result.replace(/Math\.abs\s*\(/g, 'GoianoMath.absoluto(');
    result = result.replace(/Math\.sqrt\s*\(/g, 'GoianoMath.raiz_quadrada(');
    result = result.replace(/Math\.pow\s*\(/g, 'GoianoMath.potencia(');
    result = result.replace(/Math\.PI\b/g, 'GoianoMath.PI');
    result = result.replace(/Math\.E\b/g, 'GoianoMath.E');
    
    // Global functions
    result = result.replace(/parseInt\s*\(/g, 'vira_numero(');
    result = result.replace(/parseFloat\s*\(/g, 'vira_decimal(');
    result = result.replace(/isNaN\s*\(/g, 'eh_nao_numero(');
    result = result.replace(/setTimeout\s*\(/g, 'depois_de(');
    result = result.replace(/setInterval\s*\(/g, 'repetir_a_cada(');
    result = result.replace(/clearTimeout\s*\(/g, 'cancelar_depois(');
    result = result.replace(/clearInterval\s*\(/g, 'cancelar_repeticao(');
    
    // Console methods  
    result = result.replace(/console\.log\s*\(/g, 'prosa(');
    result = result.replace(/console\.error\s*\(/g, 'prosa_erro(');
    result = result.replace(/console\.warn\s*\(/g, 'prosa_aviso(');
    
    return result;
  }

  /**
   * Check for forbidden non-Goiano methods
   * @private
   */
  _checkForbiddenMethods(code) {
    const warnings = [];
    const forbiddenMethods = [
      '.replace(', '.split(', '.join(', '.toUpperCase()', '.toLowerCase()', 
      '.map(', '.filter(', '.reduce(', '.forEach(', '.push(', '.pop()',
      'Math.random()', 'Math.floor(', 'console.log(', 'parseInt(', 'setTimeout('
    ];
    
    forbiddenMethods.forEach(method => {
      if (code.includes(method)) {
        const goianoEquivalent = this.goianoBuiltins.converterParaGoiano(method.replace(/[()]/g, ''));
        warnings.push({
          type: 'forbidden_method',
          message: `⚠️ Ô sô! O método "${method}" não é goiano não! Use "${goianoEquivalent}" que é mais da hora.`,
          suggestion: `Troca esse ${method} por .${goianoEquivalent}(`
        });
      }
    });
    
    return warnings;
  }

  /**
   * Validate basic syntax patterns
   * @private
   */
  _validateSyntax(code) {
    const errors = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        // Check for unmatched braces/brackets
        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;
        const openBrackets = (line.match(/\[/g) || []).length;
        const closeBrackets = (line.match(/\]/g) || []).length;
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;
        
        // Simple check for obvious syntax errors
        if (trimmed.includes('{{{') || trimmed.includes('}}}')) {
          errors.push({
            message: `Erro de sintaxe na linha ${index + 1}: Chaves desbalanceadas`,
            type: 'syntax_error',
            line: index + 1
          });
        }
        
        // Check for incomplete variable declarations
        if (trimmed.startsWith('uai ') && !trimmed.includes(' é ')) {
          errors.push({
            message: `Erro de sintaxe na linha ${index + 1}: Declaração de variável incompleta`,
            type: 'syntax_error',
            line: index + 1
          });
        }
      }
    });
    
    return errors;
  }

  /**
   * Generate simple tokens for validation
   * @private
   */
  _generateTokens(code) {
    const tokens = [];
    const lines = code.split('\n');
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('//')) {
        // Simple tokenization - split on spaces and common separators
        const words = trimmed.split(/[\s\(\)\{\}\[\];,\.]+/).filter(w => w.length > 0);
        words.forEach(word => {
          tokens.push({
            type: this._getTokenType(word),
            value: word,
            line: index + 1
          });
        });
      }
    });
    
    return tokens;
  }

  /**
   * Get token type for simple validation
   * @private
   */
  _getTokenType(word) {
    const keywords = ['uai', 'trem', 'faz_trem', 'prosa', 'faz_favor', 'se', 'senao', 'pra', 'enquanto'];
    if (keywords.includes(word)) return 'keyword';
    if (/^\d+(\.\d+)?$/.test(word)) return 'number';
    if (/^["'].*["']$/.test(word)) return 'string';
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(word)) return 'identifier';
    return 'symbol';
  }

  /**
   * Escape special characters for regex
   * @private
   */
  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = SimpleGoiasScriptTranspiler;