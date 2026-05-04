const SimpleTranspiler = require('./compiler/simpleTranspiler');
const GoianoBuiltins = require('./goianoMethods/GoianoBuiltins');

// Optional feature modules — gracefully degrade when absent (v1.5 slim build).
// When the source files exist, full v2 behavior is preserved; when they're
// archived for v1.5, the compiler falls back to no-op stubs so transpilation
// keeps working without type checking, module resolution, or JIT optimization.
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

class NoopJITCompiler {
  shouldApplyJIT() {
    return false;
  }
  compile(code) {
    return code;
  }
  generatePerformanceReport() {
    return null;
  }
  clearCache() {}
  setOptimizations() {}
  setThreshold() {}
  getHotSpots() {
    return [];
  }
}

const TypeAnalyzer = loadOptional('./types/TypeAnalyzer', NoopTypeAnalyzer);
const ModuleResolver = loadOptional('./modules/ModuleResolver', NoopModuleResolver);
const GoianoJITCompiler = loadOptional('./performance/JITCompiler', NoopJITCompiler);

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
    this.jitCompiler = new GoianoJITCompiler();
    this.options = {
      enableTypeChecking: true,
      enableModuleResolution: true,
      enableGoianoMethods: true,
      enableJIT: true,
      ...options,
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
        errors: [],
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
          dependencies: moduleResult.dependencies,
        };
        result.warnings.push(...(moduleResult.warnings || []));
      }

      // 2. Type Analysis (if enabled)
      if (this.options.enableTypeChecking) {
        const typeResult = this.typeAnalyzer.analyze(processedCode, fileName);
        result.typeInfo = {
          typeCount: typeResult.typeCount,
          symbols: typeResult.symbolTable,
          hasTypeErrors: typeResult.hasTypeErrors,
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

      // 4. JIT Optimization (if enabled)
      if (this.options.enableJIT) {
        const identifier = this._generateIdentifier(fileName, code);

        if (this.jitCompiler.shouldApplyJIT(result.javascript, identifier)) {
          result.javascript = this.jitCompiler.compile(result.javascript, identifier);
          result.jitOptimized = true;
          result.warnings.push({
            type: 'jit_optimization',
            message: `🔥 Código otimizado via JIT para "${identifier}"`,
          });
        }
      }

      result.success = true;
      return result;
    } catch (error) {
      return {
        success: false,
        javascript: null,
        typeInfo: null,
        moduleInfo: null,
        warnings: [],
        errors: [
          {
            type: 'compilation_error',
            message: `Erro na compilação: ${error.message}`,
            line: 0,
            column: 0,
          },
        ],
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

  /**
   * Validate GoiásScript code syntax
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {Object} Validation result
   */
  validate(code, fileName = 'script.gs') {
    try {
      // Use transpiler to validate syntax
      const transpileResult = this.transpiler.transpile(code, fileName);

      return {
        valid: transpileResult.success,
        errors: transpileResult.success ? [] : [transpileResult.error],
        tokens: transpileResult.tokens || [],
        warnings: transpileResult.warnings || [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: error.message, type: 'validation_error' }],
        tokens: [],
        warnings: [],
      };
    }
  }

  /**
   * Transpile code without execution
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {Object} Transpilation result
   */
  transpile(code, fileName = 'script.gs') {
    return this.compile(code, fileName);
  }

  /**
   * Get compilation statistics
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {Object} Compilation statistics
   */
  getCompilationStats(code, fileName = 'script.gs') {
    const result = this.compile(code, fileName);

    return {
      success: result.success,
      linesOfCode: code.split('\n').length,
      typeCount: result.typeInfo ? result.typeInfo.typeCount : 0,
      moduleCount: result.moduleInfo ? result.moduleInfo.dependencies.length : 0,
      warningCount: result.warnings.length,
      errorCount: result.errors.length,
      hasModules: result.moduleInfo ? result.moduleInfo.hasModules : false,
      hasTypes: result.typeInfo ? result.typeInfo.typeCount > 0 : false,
    };
  }

  /**
   * Execute compiled GoiásScript code
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {Object} Execution result
   */
  execute(code, fileName = 'script.gs') {
    try {
      const compileResult = this.compile(code, fileName);

      if (!compileResult.success) {
        return {
          success: false,
          error: compileResult.errors[0] || { message: 'Compilation failed' },
          output: null,
        };
      }

      // Execute compiled JavaScript
      const result = eval(compileResult.javascript);

      return {
        success: true,
        output: result,
        error: null,
      };
    } catch (error) {
      return {
        success: false,
        error: { message: error.message, type: 'execution_error' },
        output: null,
      };
    }
  }

  /**
   * Transpile only (alias for transpile method)
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {string} JavaScript code
   */
  transpileOnly(code, fileName = 'script.gs') {
    const result = this.compile(code, fileName);
    return result.success ? result.javascript : null;
  }

  /**
   * Generate unique identifier for JIT caching
   * @private
   */
  _generateIdentifier(fileName, code) {
    const hash = code.split('').reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);

    return `${fileName.replace(/[^\w]/g, '_')}_${Math.abs(hash)}`;
  }

  /**
   * Get JIT performance report
   */
  getJITReport() {
    return this.jitCompiler ? this.jitCompiler.generatePerformanceReport() : null;
  }

  /**
   * Clear JIT cache
   */
  clearJITCache() {
    if (this.jitCompiler) {
      this.jitCompiler.clearCache();
    }
  }

  /**
   * Configure JIT optimizations
   */
  configureJIT(options) {
    if (this.jitCompiler) {
      if (options.optimizations) {
        this.jitCompiler.setOptimizations(options.optimizations);
      }
      if (options.threshold) {
        this.jitCompiler.setThreshold(options.threshold);
      }
    }
  }

  /**
   * Get JIT hot spots
   */
  getJITHotSpots() {
    return this.jitCompiler ? this.jitCompiler.getHotSpots() : [];
  }

  /**
   * Compile with additional statistics
   * @param {string} code - GoiásScript source code
   * @param {string} fileName - Source file name
   * @returns {Object} Compilation result with stats
   */
  compileWithStats(code, fileName = 'script.gs') {
    const result = this.compile(code, fileName);

    if (result.success) {
      result.stats = {
        originalSize: code.length,
        compiledSize: result.javascript.length,
        originalLines: code.split('\n').length,
        compiledLines: result.javascript.split('\n').length,
      };
    }

    return result;
  }
}

module.exports = GoiasScriptCompiler;
