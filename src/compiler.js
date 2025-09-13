const SimpleTranspiler = require('./compiler/simpleTranspiler');
const TypeAnalyzer = require('./types/TypeAnalyzer');
const ModuleResolver = require('./modules/ModuleResolver');
const GoianoBuiltins = require('./goianoMethods/GoianoBuiltins');

/**
 * Main GoiásScript Compiler
 * Integrates transpilation, type checking, and module resolution
 */
class GoiasScriptCompiler {
  constructor(options = {}) {
    this.transpiler = new SimpleTranspiler(options);
    this.typeAnalyzer = new TypeAnalyzer();
    this.moduleResolver = new ModuleResolver();
    this.goianoBuiltins = new GoianoBuiltins();
    this.options = {
      enableTypeChecking: true,
      enableModuleResolution: true,
      enableGoianoMethods: true,
      ...options
    };
  }

  /**
   * Compile GoiásScript code to JavaScript
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {Object} Compilation result
   */
  compile(code, fileName = 'script.gs') {
    try {
      const result = {
        success: false,
        javascript: null,
        typeInfo: null,
        moduleInfo: null,
        warnings: [],
        errors: []
      };

      // 1. Module Resolution (if enabled)
      let processedCode = code;
      if (this.options.enableModuleResolution) {
        const moduleResult = this.moduleResolver.resolveModules(code, fileName);
        processedCode = moduleResult.code;
        result.moduleInfo = {
          hasModules: moduleResult.hasModules,
          imports: moduleResult.imports,
          exports: moduleResult.exports,
          dependencies: moduleResult.dependencies
        };
        result.warnings.push(...(moduleResult.warnings || []));
      }

      // 2. Type Analysis (if enabled)
      if (this.options.enableTypeChecking) {
        const typeResult = this.typeAnalyzer.analyze(processedCode, fileName);
        result.typeInfo = {
          typeCount: typeResult.typeCount,
          symbols: typeResult.symbols,
          hasTypeErrors: typeResult.hasTypeErrors
        };
        result.warnings.push(...(typeResult.warnings || []));
        result.errors.push(...(typeResult.errors || []));
      }

      // 3. Transpilation
      const transpileResult = this.transpiler.transpile(processedCode, fileName);
      
      if (!transpileResult.success) {
        result.errors.push(transpileResult.error);
        return result;
      }

      result.javascript = transpileResult.code;
      result.warnings.push(...(transpileResult.warnings || []));
      result.success = true;

      return result;

    } catch (error) {
      return {
        success: false,
        javascript: null,
        typeInfo: null,
        moduleInfo: null,
        warnings: [],
        errors: [{
          type: 'compilation_error',
          message: `Erro na compilação: ${error.message}`,
          line: 0,
          column: 0
        }]
      };
    }
  }

  /**
   * Get available Goiano methods
   * @returns {Array} List of available Goiano methods
   */
  getGoianoMethods() {
    return this.goianoBuiltins.listarMetodosGoianos();
  }

  /**
   * Get available Goiano types
   * @returns {Array} List of available Goiano types
   */
  getGoianoTypes() {
    return this.goianoBuiltins.listarTiposGoianos();
  }

  /**
   * Clear module cache
   */
  clearModuleCache() {
    if (this.moduleResolver) {
      this.moduleResolver.clearCache();
    }
  }

  /**
   * Get module dependency report
   * @returns {Object} Dependency report
   */
  getModuleDependencyReport() {
    if (this.moduleResolver) {
      return this.moduleResolver.generateDependencyReport();
    }
    return { totalModules: 0, modules: [] };
  }

  /**
   * Check if a method is forbidden (non-Goiano)
   * @param {string} method - Method name to check
   * @returns {boolean} True if method is forbidden
   */
  isForbiddenMethod(method) {
    return this.goianoBuiltins.ehMetodoProibido(method);
  }
}

module.exports = GoiasScriptCompiler;