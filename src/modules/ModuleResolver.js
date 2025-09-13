/**
 * GoiásScript Module Resolver
 * Handles module imports and exports with authentic Goiás syntax
 * Supports relative paths and module dependency resolution
 */

const fs = require('fs');
const path = require('path');

class ModuleResolver {
  constructor() {
    // Cache for resolved modules to avoid circular dependencies
    this.moduleCache = new Map();
    
    // Module registry for dependency tracking
    this.moduleRegistry = new Map();
    
    // Warnings collection
    this.warnings = [];
    
    // Export patterns for GoiásScript
    this.exportPatterns = {
      // troca_ideia nomeFuncao ou troca_ideia { nome1, nome2 }
      NAMED_EXPORT: /^troca_ideia\s+(?:(\w+)|{\s*([^}]+)\s*})$/,
      
      // troca_ideia_principal valor or function
      DEFAULT_EXPORT: /^troca_ideia_principal\s+(.+)$/,
    };
    
    // Import patterns for GoiásScript
    this.importPatterns = {
      // pega modulo de "./caminho"
      DEFAULT_IMPORT: /^pega\s+(\w+)\s+de\s+"([^"]+)"$/,
      
      // pega { nome1, nome2 } de "./caminho"
      NAMED_IMPORT: /^pega\s+{\s*([^}]+)\s*}\s+de\s+"([^"]+)"$/,
      
      // pega modulo, { nome1, nome2 } de "./caminho"
      MIXED_IMPORT: /^pega\s+(\w+),\s*{\s*([^}]+)\s*}\s+de\s+"([^"]+)"$/,
      
      // pega tudo_de modulo de "./caminho"
      NAMESPACE_IMPORT: /^pega\s+tudo_de\s+(\w+)\s+de\s+"([^"]+)"$/,
    };
  }

  /**
   * Resolves and processes all module imports/exports in code
   * @param {string} code - GoiásScript source code
   * @param {string} filePath - Current file path
   * @returns {Object} Processed code and module information
   */
  resolveModules(code, filePath) {
    const currentDir = path.dirname(filePath);
    const lines = code.split('\n');
    const processedLines = [];
    const imports = [];
    const exports = [];
    const dependencies = [];
    
    // Clear warnings for new resolution
    this.warnings = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!line || line.startsWith('//')) {
        processedLines.push(lines[i]);
        continue;
      }

      // Process imports
      const importResult = this._processImport(line, currentDir);
      if (importResult) {
        imports.push(importResult);
        dependencies.push(importResult.modulePath);
        
        // Check if module exists and add warning if not
        if (!this.moduleExists(importResult.modulePath)) {
          this.warnings.push({
            type: 'module_not_found',
            message: `Ô rapaz! O módulo "${importResult.originalPath}" não foi encontrado!`,
            line: i + 1,
            file: filePath
          });
        }
        
        processedLines.push(importResult.jsCode);
        continue;
      }

      // Process exports
      const exportResult = this._processExport(line);
      if (exportResult) {
        exports.push(exportResult);
        processedLines.push(exportResult.jsCode);
        continue;
      }

      // Regular code line
      processedLines.push(lines[i]);
    }

    // Register this module
    this.moduleRegistry.set(filePath, {
      imports,
      exports,
      dependencies,
      resolved: true,
    });

    return {
      code: processedLines.join('\n'),
      imports,
      exports,
      dependencies,
      hasModules: imports.length > 0 || exports.length > 0,
      warnings: this.warnings,
    };
  }

  /**
   * Processes GoiásScript import statements
   * @private
   */
  _processImport(line, currentDir) {
    // Default import: pega modulo de "./arquivo"
    let match = line.match(this.importPatterns.DEFAULT_IMPORT);
    if (match) {
      const [, importName, modulePath] = match;
      const resolvedPath = this._resolvePath(modulePath, currentDir);
      
      return {
        type: 'default',
        importName,
        modulePath: resolvedPath,
        originalPath: modulePath,
        jsCode: `const ${importName} = require('${resolvedPath}');`,
        goiasCode: line,
      };
    }

    // Named imports: pega { func1, func2 } de "./arquivo"
    match = line.match(this.importPatterns.NAMED_IMPORT);
    if (match) {
      const [, namedImports, modulePath] = match;
      const resolvedPath = this._resolvePath(modulePath, currentDir);
      const importList = namedImports.split(',').map(n => n.trim());
      
      return {
        type: 'named',
        imports: importList,
        modulePath: resolvedPath,
        originalPath: modulePath,
        jsCode: `const { ${importList.join(', ')} } = require('${resolvedPath}');`,
        goiasCode: line,
      };
    }

    // Mixed imports: pega modulo, { func1, func2 } de "./arquivo"
    match = line.match(this.importPatterns.MIXED_IMPORT);
    if (match) {
      const [, defaultImport, namedImports, modulePath] = match;
      const resolvedPath = this._resolvePath(modulePath, currentDir);
      const importList = namedImports.split(',').map(n => n.trim());
      
      return {
        type: 'mixed',
        defaultImport,
        namedImports: importList,
        modulePath: resolvedPath,
        originalPath: modulePath,
        jsCode: `const ${defaultImport} = require('${resolvedPath}');\nconst { ${importList.join(', ')} } = ${defaultImport};`,
        goiasCode: line,
      };
    }

    // Namespace import: pega tudo_de Utils de "./utils"
    match = line.match(this.importPatterns.NAMESPACE_IMPORT);
    if (match) {
      const [, namespaceName, modulePath] = match;
      const resolvedPath = this._resolvePath(modulePath, currentDir);
      
      return {
        type: 'namespace',
        namespace: namespaceName,
        modulePath: resolvedPath,
        originalPath: modulePath,
        jsCode: `const ${namespaceName} = require('${resolvedPath}');`,
        goiasCode: line,
      };
    }

    return null;
  }

  /**
   * Processes GoiásScript export statements
   * @private
   */
  _processExport(line) {
    // Default export: troca_ideia_principal valor
    let match = line.match(this.exportPatterns.DEFAULT_EXPORT);
    if (match) {
      const [, exportValue] = match;
      
      return {
        type: 'default',
        value: exportValue.trim(),
        jsCode: `module.exports = ${exportValue.trim()};`,
        goiasCode: line,
      };
    }

    // Named exports: troca_ideia funcao or troca_ideia { func1, func2 }
    match = line.match(this.exportPatterns.NAMED_EXPORT);
    if (match) {
      const [, singleExport, multipleExports] = match;
      
      if (singleExport) {
        return {
          type: 'named_single',
          name: singleExport,
          jsCode: `module.exports.${singleExport} = ${singleExport};`,
          goiasCode: line,
        };
      } else if (multipleExports) {
        const exportList = multipleExports.split(',').map(n => n.trim());
        const jsExports = exportList.map(name => `${name}`).join(', ');
        
        return {
          type: 'named_multiple',
          exports: exportList,
          jsCode: `module.exports = { ${jsExports} };`,
          goiasCode: line,
        };
      }
    }

    return null;
  }

  /**
   * Resolves module paths (relative to absolute)
   * @private
   */
  _resolvePath(modulePath, currentDir) {
    // Handle relative paths
    if (modulePath.startsWith('./') || modulePath.startsWith('../')) {
      const resolved = path.resolve(currentDir, modulePath);
      
      // Add .gs extension if no extension provided
      if (!path.extname(resolved)) {
        return resolved + '.gs';
      }
      
      return resolved;
    }

    // Handle absolute paths or node_modules
    return modulePath;
  }

  /**
   * Validates module exists and is accessible
   * @param {string} modulePath - Path to module
   * @returns {boolean} Whether module exists
   */
  moduleExists(modulePath) {
    try {
      // For GoiásScript files, check file existence
      if (modulePath.endsWith('.gs')) {
        return fs.existsSync(modulePath);
      }
      
      // For Node modules, try to resolve
      require.resolve(modulePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets dependency graph for a module
   * @param {string} filePath - File path
   * @returns {Array} List of dependencies
   */
  getDependencies(filePath) {
    const moduleInfo = this.moduleRegistry.get(filePath);
    return moduleInfo ? moduleInfo.dependencies : [];
  }

  /**
   * Gets warnings from module resolution
   * @returns {Array} List of warnings
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Checks for circular dependencies
   * @param {string} filePath - Starting file path
   * @returns {Array} Circular dependency chain if found
   */
  detectCircularDependencies(filePath, visited = new Set(), path = []) {
    if (visited.has(filePath)) {
      const circularStart = path.indexOf(filePath);
      return path.slice(circularStart).concat([filePath]);
    }

    visited.add(filePath);
    path.push(filePath);

    const dependencies = this.getDependencies(filePath);
    
    for (const dep of dependencies) {
      const circular = this.detectCircularDependencies(dep, visited, [...path]);
      if (circular) {
        return circular;
      }
    }

    return null;
  }

  /**
   * Clears module cache (useful for testing)
   */
  clearCache() {
    this.moduleCache.clear();
    this.moduleRegistry.clear();
  }

  /**
   * Gets module information
   * @param {string} filePath - File path
   * @returns {Object} Module information
   */
  getModuleInfo(filePath) {
    return this.moduleRegistry.get(filePath) || null;
  }

  /**
   * Generates module dependency report
   * @returns {Object} Dependency report
   */
  generateDependencyReport() {
    const report = {
      totalModules: this.moduleRegistry.size,
      modules: [],
      circularDependencies: [],
    };

    for (const [filePath, moduleInfo] of this.moduleRegistry) {
      report.modules.push({
        path: filePath,
        imports: moduleInfo.imports.length,
        exports: moduleInfo.exports.length,
        dependencies: moduleInfo.dependencies,
      });

      const circular = this.detectCircularDependencies(filePath);
      if (circular) {
        report.circularDependencies.push(circular);
      }
    }

    return report;
  }
}

module.exports = ModuleResolver;