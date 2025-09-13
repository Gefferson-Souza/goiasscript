/**
 * GoiásScript JIT Compiler MVP
 * Just-In-Time compilation for performance optimization
 * Fase 5: Performance & Otimização
 */

const GoianoASTParser = require('../parser/ASTParser');

class GoianoJITCompiler {
  constructor() {
    this.hotSpots = new Map(); // Código executado frequentemente
    this.compiledCache = new Map(); // Cache de código otimizado
    this.executionCounts = new Map(); // Contador de execuções
    this.threshold = 5; // Limite para ativar JIT
    this.astParser = new GoianoASTParser();
    this.optimizations = {
      inlineExpressions: true,
      loopUnrolling: true,
      constantFolding: true,
      deadCodeElimination: true,
      astOptimization: true
    };
  }

  /**
   * Analisa código e decide se deve aplicar JIT
   * @param {string} code - Código GoiásScript
   * @param {string} identifier - Identificador único (função/bloco)
   * @returns {boolean} Se deve aplicar JIT
   */
  shouldApplyJIT(code, identifier) {
    const count = this.executionCounts.get(identifier) || 0;
    this.executionCounts.set(identifier, count + 1);
    
    // Aplica JIT apenas após múltiplas execuções
    return count >= this.threshold;
  }

  /**
   * Compila código com otimizações JIT
   * @param {string} code - Código GoiásScript original
   * @param {string} identifier - Identificador único
   * @returns {string} Código JavaScript otimizado
   */
  compile(code, identifier) {
    // Verificar cache primeiro
    if (this.compiledCache.has(identifier)) {
      return this.compiledCache.get(identifier);
    }

    console.log(`🔥 JIT: Otimizando hot spot "${identifier}"`);
    
    let optimizedCode = code;

    // Aplicar otimizações sequencialmente
    if (this.optimizations.constantFolding) {
      optimizedCode = this._applyConstantFolding(optimizedCode);
    }

    if (this.optimizations.inlineExpressions) {
      optimizedCode = this._applyInlining(optimizedCode);
    }

    if (this.optimizations.loopUnrolling) {
      optimizedCode = this._applyLoopUnrolling(optimizedCode);
    }

    if (this.optimizations.deadCodeElimination) {
      optimizedCode = this._eliminateDeadCode(optimizedCode);
    }

    // AST-based optimizations
    if (this.optimizations.astOptimization) {
      optimizedCode = this._applyASTOptimizations(optimizedCode, identifier);
    }

    // Adicionar profiling hooks
    optimizedCode = this._addProfilingHooks(optimizedCode, identifier);

    // Cache do código otimizado
    this.compiledCache.set(identifier, optimizedCode);
    this.hotSpots.set(identifier, {
      originalCode: code,
      optimizedCode: optimizedCode,
      compiledAt: Date.now(),
      executions: this.executionCounts.get(identifier)
    });

    return optimizedCode;
  }

  /**
   * Constant Folding - Avalia expressões constantes em tempo de compilação
   * @private
   */
  _applyConstantFolding(code) {
    // Otimizar operações matemáticas simples
    code = code.replace(/(\d+)\s*\+\s*(\d+)/g, (match, a, b) => {
      return (parseInt(a) + parseInt(b)).toString();
    });

    code = code.replace(/(\d+)\s*\*\s*(\d+)/g, (match, a, b) => {
      return (parseInt(a) * parseInt(b)).toString();
    });

    // Otimizar concatenação de strings
    code = code.replace(/"([^"]*?)"\s*\+\s*"([^"]*?)"/g, '"$1$2"');

    return code;
  }

  /**
   * Inline Expressions - Substitui chamadas de função por código inline
   * @private
   */
  _applyInlining(code) {
    // Inline de operações matemáticas simples do GoianoMath
    code = code.replace(/GoianoMath\.maior\((\d+),\s*(\d+)\)/g, (match, a, b) => {
      return `(${a} > ${b} ? ${a} : ${b})`;
    });

    code = code.replace(/GoianoMath\.arredondar\(([^)]+)\)/g, 'Math.round($1)');

    // Inline de métodos de string simples
    code = code.replace(/\.pra_maiusculo\(\)/g, '.toUpperCase()');
    code = code.replace(/\.pra_minusculo\(\)/g, '.toLowerCase()');

    return code;
  }

  /**
   * Loop Unrolling - Desenrola loops pequenos para melhor performance
   * @private
   */
  _applyLoopUnrolling(code) {
    // Desenrolar loops 'pra' pequenos (até 4 iterações)
    const loopRegex = /pra\s*\(\s*uai\s+(\w+)\s+é\s+(\d+);\s*\1\s*<\s*(\d+);\s*\1\+\+\s*\)\s*\{([^}]*)\}/g;
    
    code = code.replace(loopRegex, (match, varName, start, end, body) => {
      const startNum = parseInt(start);
      const endNum = parseInt(end);
      const iterations = endNum - startNum;
      
      // Só desenrolar loops pequenos
      if (iterations <= 4 && iterations > 0) {
        let unrolled = '';
        for (let i = startNum; i < endNum; i++) {
          const iterationBody = body.replace(new RegExp(`\\b${varName}\\b`, 'g'), i.toString());
          unrolled += `{ ${iterationBody.trim()} }\n`;
        }
        return unrolled;
      }
      
      return match; // Manter loop original se muito grande
    });

    return code;
  }

  /**
   * Dead Code Elimination - Remove código não alcançável
   * @private
   */
  _eliminateDeadCode(code) {
    // Remove código após return
    code = code.replace(/faz_favor\s+[^;]+;[\s\S]*?(})/g, 'faz_favor $1; $2');
    
    // Remove variáveis não utilizadas (aproximação simples)
    const lines = code.split('\n');
    const usedVars = new Set();
    const declaredVars = new Set();
    
    // Primeira passada: encontrar variáveis usadas
    lines.forEach(line => {
      const varUsage = line.match(/\b(\w+)\b/g);
      if (varUsage) {
        varUsage.forEach(v => usedVars.add(v));
      }
    });
    
    // Segunda passada: encontrar declarações
    lines.forEach(line => {
      const varDecl = line.match(/uai\s+(\w+)\s+é/);
      if (varDecl) {
        declaredVars.add(varDecl[1]);
      }
    });
    
    // Remover declarações não usadas
    const filteredLines = lines.filter(line => {
      const varDecl = line.match(/uai\s+(\w+)\s+é/);
      if (varDecl) {
        const varName = varDecl[1];
        // Manter se usado mais de uma vez (declaração + uso)
        const usageCount = [...lines.join(' ').matchAll(new RegExp(`\\b${varName}\\b`, 'g'))].length;
        return usageCount > 1;
      }
      return true;
    });
    
    return filteredLines.join('\n');
  }

  /**
   * Aplica otimizações baseadas em AST
   * @private
   */
  _applyASTOptimizations(code, identifier) {
    try {
      // Parse código para AST
      const ast = this.astParser.parse(code);
      const analysis = this.astParser.analyzeForOptimizations(ast);
      
      let optimized = code;
      
      // Otimização baseada na análise
      if (analysis.complexityScore > 10) {
        // Código complexo - aplicar otimizações agressivas
        console.log(`🔥 JIT [${identifier}]: Código complexo detectado (score: ${analysis.complexityScore})`);
        optimized = this._applyAggressiveOptimizations(optimized, analysis);
      }
      
      // Otimizar loops identificados
      if (analysis.loops.length > 0) {
        console.log(`🔥 JIT [${identifier}]: ${analysis.loops.length} loops detectados`);
        optimized = this._optimizeLoops(optimized, analysis.loops);
      }
      
      // Otimizar funções pequenas
      if (analysis.functions.length > 0) {
        optimized = this._optimizeSmallFunctions(optimized, analysis.functions);
      }
      
      return optimized;
      
    } catch (error) {
      console.warn(`⚠️ JIT [${identifier}]: Falha na otimização AST:`, error.message);
      return code;
    }
  }

  /**
   * Aplica otimizações agressivas para código complexo
   * @private
   */
  _applyAggressiveOptimizations(code, analysis) {
    // Memoização para funções puras
    code = code.replace(
      /faz_trem (\w+)\(([^)]*)\)\s*\{([^}]*faz_favor[^}]*)\}/g,
      (match, funcName, params, body) => {
        if (!body.includes('uai ') && !body.includes('prosa(')) {
          // Função possivelmente pura - adicionar memoização
          return `
const __memo_${funcName} = new Map();
faz_trem ${funcName}(${params}) {
  const __key = JSON.stringify(arguments);
  if (__memo_${funcName}.has(__key)) {
    return __memo_${funcName}.get(__key);
  }
  ${body}
  const __result = ${body.match(/faz_favor\s+([^;]+)/)?.[1] || 'undefined'};
  __memo_${funcName}.set(__key, __result);
  return __result;
}`;
        }
        return match;
      }
    );
    
    return code;
  }

  /**
   * Otimiza loops identificados no AST
   * @private
   */
  _optimizeLoops(code, loops) {
    // Vectorização de loops simples
    code = code.replace(
      /pra\s*\(\s*uai\s+(\w+)\s+=\s+0;\s*\1\s+<\s+(\w+)\.tamanho\(\);\s*\1\+\+\s*\)\s*\{\s*(\w+)\[(\1)\]\s*([+\-*/]?=)\s*([^;]+);\s*\}/g,
      (match, i, arr, targetArr, indexVar, op, value) => {
        // Tentar vectorizar operações em array
        return `${targetArr}.forEach((item, ${i}) => { ${targetArr}[${i}] ${op} ${value}; });`;
      }
    );
    
    return code;
  }

  /**
   * Otimiza funções pequenas
   * @private
   */
  _optimizeSmallFunctions(code, functions) {
    // Inline de funções muito pequenas (menos de 3 linhas)
    functions.forEach(func => {
      if (func.paramCount <= 2) {
        const funcRegex = new RegExp(`faz_trem\\s+${func.name}\\s*\\([^)]*\\)\\s*\\{([^}]{1,100})\\}`, 'g');
        code = code.replace(funcRegex, (match, body) => {
          if ((body.match(/;/g) || []).length <= 2) {
            // Função pequena - marcar para possível inlining
            return `/* INLINE_CANDIDATE */ ${match}`;
          }
          return match;
        });
      }
    });
    
    return code;
  }

  /**
   * Adiciona hooks de profiling para coleta de métricas
   * @private
   */
  _addProfilingHooks(code, identifier) {
    const profilingCode = `
// JIT Profiling Start
const __jit_start_${identifier.replace(/\W/g, '_')} = performance.now();
${code}
// JIT Profiling End
const __jit_end_${identifier.replace(/\W/g, '_')} = performance.now();
console.log('🔥 JIT [${identifier}]: ' + (__jit_end_${identifier.replace(/\W/g, '_')} - __jit_start_${identifier.replace(/\W/g, '_')}) + 'ms');
    `;
    
    return profilingCode;
  }

  /**
   * Gera relatório de performance
   */
  generatePerformanceReport() {
    const report = {
      totalHotSpots: this.hotSpots.size,
      totalExecutions: Array.from(this.executionCounts.values()).reduce((a, b) => a + b, 0),
      cacheHitRatio: this.compiledCache.size / Math.max(this.hotSpots.size, 1),
      optimizations: this.optimizations,
      hotSpots: []
    };

    this.hotSpots.forEach((info, identifier) => {
      report.hotSpots.push({
        identifier,
        executions: info.executions,
        compiledAt: new Date(info.compiledAt).toISOString(),
        originalSize: info.originalCode.length,
        optimizedSize: info.optimizedCode.length,
        compressionRatio: (info.originalCode.length - info.optimizedCode.length) / info.originalCode.length
      });
    });

    return report;
  }

  /**
   * Limpa cache de código compilado
   */
  clearCache() {
    this.compiledCache.clear();
    this.hotSpots.clear();
    console.log('🔥 JIT: Cache limpo');
  }

  /**
   * Configura otimizações ativas
   */
  setOptimizations(optimizations) {
    this.optimizations = { ...this.optimizations, ...optimizations };
  }

  /**
   * Define threshold para ativação do JIT
   */
  setThreshold(threshold) {
    this.threshold = threshold;
  }

  /**
   * Obtém estatísticas de hot spots
   */
  getHotSpots() {
    return Array.from(this.hotSpots.entries()).map(([identifier, info]) => ({
      identifier,
      executions: this.executionCounts.get(identifier),
      ...info
    }));
  }
}

module.exports = GoianoJITCompiler;