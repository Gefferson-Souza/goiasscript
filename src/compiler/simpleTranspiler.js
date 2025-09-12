const ErrorTranslator = require('../errors/errorTranslator');

/**
 * Transpiler simplificado do GoiásScript
 * Implementa substituições diretas para funcionar imediatamente
 */
class SimpleGoiasScriptTranspiler {
  constructor(options = {}) {
    this.errorTranslator = new ErrorTranslator();
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
      let jsCode = code;

      // Apply all substitutions
      jsCode = this._applySubstitutions(jsCode);
      
      return {
        success: true,
        code: jsCode,
        warnings: [],
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

    // Direct mappings ordered by size (largest first)
    const mappings = [
      // Async functions first
      ['vai_na_frente_presta_serviço', 'async function'],
      
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
      ['presta_serviço', 'function'],
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
      
      // Types
      ['certeza', 'true'],
      ['de_jeito_nenhum', 'false'],
      ['vazio', 'null'],
      ['sei_lá', 'undefined'],
      
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
      } else if (goiasWord === 'num_é') {
        // Handle 'num_é' (NOT operator) specially to avoid extra space
        result = result.replace(/\bnum_é\s+/g, '!');
      } else if (goiasWord.includes('_') || /[àáâãçéêí]/.test(goiasWord)) {
        // Words with underscore or accents need special treatment
        // Include common punctuation as delimiters
        // Words with underscore or accents need special treatment
        // Include common punctuation as delimiters
        const wordRegex = new RegExp(
          `(^|\\s|\\(|,|\\.|;)${this._escapeRegex(goiasWord)}(\\s|$|\\)|,|\\(|;|\\.)`,
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
   * Escape special characters for regex
   * @private
   */
  _escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = SimpleGoiasScriptTranspiler;