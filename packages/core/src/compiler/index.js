const GoiasScriptTranspiler = require('./simpleTranspiler');
const GoiasScriptLexer = require('./lexer');

function loadOptional(modulePath, fallback) {
  try {
    return require(modulePath);
  } catch (err) {
    if (err && err.code === 'MODULE_NOT_FOUND') {
      return fallback;
    }
    throw err;
  }
}

class NoopTypeAnalyzer {
  analyze() {
    return { typeCount: 0, symbolTable: {}, hasTypeErrors: false, warnings: [], errors: [] };
  }
}

class NoopModuleResolver {
  resolveModules(code) {
    return { code, hasModules: false, imports: [], exports: [], dependencies: [], warnings: [] };
  }
  clearCache() {}
  generateDependencyReport() {
    return { totalModules: 0, modules: [] };
  }
  moduleExists() {
    return true;
  }
  detectCircularDependencies() {
    return null;
  }
}

const TypeAnalyzer = loadOptional('../types/TypeAnalyzer', NoopTypeAnalyzer);
const ModuleResolver = loadOptional('../modules/ModuleResolver', NoopModuleResolver);

/**
 * Main entry point for GoiásScript compiler
 * Implements Facade Pattern to simplify interface
 */
class GoiasScriptCompiler {
  constructor(options = {}) {
    this.transpiler = new GoiasScriptTranspiler(options);
    this.lexer = new GoiasScriptLexer();
    this.typeAnalyzer = new TypeAnalyzer();
    this.moduleResolver = new ModuleResolver();
    this.options = options;
  }

  /**
   * Compiles GoiásScript code
   * @param {string} code - Source code
   * @param {string} fileName - File name (optional)
   * @returns {Object} Compilation result
   */
  compile(code, fileName = 'script.gs') {
    try {
      // Step 1: Resolve modules first
      const moduleResolution = this.moduleResolver.resolveModules(code, fileName);
      let processedCode = moduleResolution.code;

      // Step 2: Perform type analysis on processed code
      const typeAnalysis = this.typeAnalyzer.analyze(processedCode, fileName);

      // Step 3: Transpile to JavaScript
      const result = this.transpiler.transpile(processedCode, fileName);

      if (!result.success) {
        return result;
      }

      // Step 4: Validate module dependencies
      const moduleWarnings = this._validateModuleDependencies(moduleResolution);

      // Combine all warnings
      const allWarnings = [...(result.warnings || []), ...typeAnalysis.warnings, ...moduleWarnings];

      return {
        success: true,
        javascript: result.code,
        sourceMap: result.sourceMap,
        warnings: allWarnings,
        typeInfo: {
          symbols: typeAnalysis.symbolTable,
          typeErrors: typeAnalysis.errors,
          hasTypeErrors: typeAnalysis.hasTypeErrors,
          typeCount: typeAnalysis.typeCount,
        },
        moduleInfo: {
          hasModules: moduleResolution.hasModules,
          imports: moduleResolution.imports,
          exports: moduleResolution.exports,
          dependencies: moduleResolution.dependencies,
        },
        stats: this._getCompilationStats(code, result.code),
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
   * Executes GoiásScript code directly
   * @param {string} code - Source code
   * @param {string} fileName - File name (optional)
   * @returns {Promise} Execution result
   */
  async execute(code, fileName = 'script.gs') {
    const result = this.compile(code, fileName);

    if (!result.success) {
      if (result.error && result.error.mostrarErro) {
        result.error.mostrarErro();
      } else {
        console.error('Compilation error:', result.error);
      }
      return;
    }

    try {
      // Create isolated execution context
      const context = this._createExecutionContext();

      // Execute generated JavaScript code
      const func = new Function(...Object.keys(context), result.javascript);
      await func(...Object.values(context));
    } catch (error) {
      const goiasError = this.transpiler.errorTranslator.translate(error, fileName);
      goiasError.mostrarErro();
    }
  }

  /**
   * Only transpiles without executing
   * @param {string} code - Source code
   * @param {string} fileName - File name (optional)
   * @returns {string|null} JavaScript code or null on error
   */
  transpileOnly(code, fileName = 'script.gs') {
    const result = this.compile(code, fileName);
    return result.success ? result.javascript : null;
  }

  /**
   * Validates syntax without executing
   * @param {string} code - Source code
   * @returns {Object} Validation result
   */
  validate(code) {
    try {
      const tokens = this.lexer.tokenize(code);
      const result = this.transpiler.transpile(code, 'validation.gs');

      if (!result.success) {
        return {
          valid: false,
          tokens: tokens,
          errors: [result.error],
          warnings: result.warnings || [],
        };
      }

      // Try to analyze generated JavaScript to detect syntax errors
      try {
        new Function(result.code);
        return {
          valid: true,
          tokens: tokens,
          errors: [],
          warnings: result.warnings || [],
        };
      } catch (syntaxError) {
        const goiasError = this.transpiler.errorTranslator.translate(syntaxError, 'validation.gs');
        return {
          valid: false,
          tokens: tokens,
          errors: [goiasError],
          warnings: result.warnings || [],
        };
      }
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
   * Creates execution context with helper functions
   * @private
   * @returns {Object} Execution context
   */
  _createExecutionContext() {
    return {
      // Global GoiásScript functions
      vixeGoiano: (message, type = 'execucao', tip = null) => {
        const ErroGoiano = require('../errors/ErroGoiano');
        throw new ErroGoiano(type, message, tip);
      },

      // Debug utilities
      __debug: message => {
        if (this.options.debug) {
          console.log('[DEBUG GoiásScript]:', message);
        }
      },

      // Custom promises (if needed)
      promessa: Promise,

      // Console with Goias style
      console: console,

      // Other global utilities
      setTimeout: setTimeout,
      setInterval: setInterval,
      clearTimeout: clearTimeout,
      clearInterval: clearInterval,

      // Common Node.js modules (if in Node environment)
      ...(typeof require !== 'undefined'
        ? {
            require: require,
            module: module,
            exports: exports,
            __filename: __filename,
            __dirname: __dirname,
          }
        : {}),
    };
  }

  /**
   * Validates module dependencies and generates warnings
   * @private
   * @param {Object} moduleResolution - Module resolution result
   * @returns {Array} Array of warnings
   */
  _validateModuleDependencies(moduleResolution) {
    const warnings = [];

    if (!moduleResolution.hasModules) {
      return warnings;
    }

    // Check if imported modules exist
    for (const importInfo of moduleResolution.imports) {
      if (!this.moduleResolver.moduleExists(importInfo.modulePath)) {
        warnings.push({
          type: 'module_not_found',
          message: `⚠️  Ô rapaz! Módulo '${importInfo.originalPath}' não foi encontrado!`,
          suggestion: `💡 Dica: Vê se o caminho tá certo ou se o arquivo existe.`,
          line: 1, // TODO: Track actual line numbers
          modulePath: importInfo.originalPath,
        });
      }
    }

    // Check for circular dependencies
    const fileName = moduleResolution.dependencies.length > 0 ? 'current_file.gs' : null;
    if (fileName) {
      const circular = this.moduleResolver.detectCircularDependencies(fileName);
      if (circular) {
        warnings.push({
          type: 'circular_dependency',
          message: `⚠️  Vixe! Dependência circular detectada!`,
          suggestion: `💡 Dica: Reorganize os módulos para evitar referência circular.`,
          cycle: circular,
        });
      }
    }

    return warnings;
  }

  /**
   * Compiles and processes a GoiásScript module file
   * @param {string} filePath - Path to the module file
   * @returns {Object} Module compilation result
   */
  compileModule(filePath) {
    const fs = require('fs');

    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      const result = this.compile(code, filePath);

      if (result.success && result.moduleInfo.hasModules) {
        // Process all dependencies recursively
        const dependencyResults = [];

        for (const depPath of result.moduleInfo.dependencies) {
          if (depPath.endsWith('.gs')) {
            const depResult = this.compileModule(depPath);
            dependencyResults.push({
              path: depPath,
              result: depResult,
            });
          }
        }

        result.dependencies = dependencyResults;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error,
        javascript: null,
        filePath,
      };
    }
  }

  /**
   * Gets module dependency report
   * @returns {Object} Dependency report
   */
  getModuleDependencyReport() {
    return this.moduleResolver.generateDependencyReport();
  }

  /**
   * Clears module cache (useful for development)
   */
  clearModuleCache() {
    this.moduleResolver.clearCache();
  }

  /**
   * Generates compilation statistics
   * @private
   * @param {string} originalCode - Original code
   * @param {string} compiledCode - Compiled code
   * @returns {Object} Statistics
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
