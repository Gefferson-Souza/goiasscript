const fs = require('fs');
const path = require('path');
const GoiasScriptCompiler = require('../compiler');

/**
 * GoiásScript Debugger - Debug Goiano
 * Sistema de debug nativo para GoiásScript
 */
class GoianoDebugger {
  constructor() {
    this.compiler = new GoiasScriptCompiler();
    this.breakpoints = new Map(); // arquivo -> linhas
    this.watchlist = new Set();   // variáveis para monitorar
    this.callStack = [];
    this.currentExecution = null;
    this.stepMode = false;
    this.debugMode = true;
  }

  /**
   * Adiciona breakpoint em linha específica
   * @param {string} file - Arquivo GoiásScript
   * @param {number} line - Número da linha
   */
  addBreakpoint(file, line) {
    if (!this.breakpoints.has(file)) {
      this.breakpoints.set(file, new Set());
    }
    
    this.breakpoints.get(file).add(line);
    console.log(`🔴 Breakpoint adicionado em ${file}:${line}`);
  }

  /**
   * Remove breakpoint
   * @param {string} file - Arquivo GoiásScript  
   * @param {number} line - Número da linha
   */
  removeBreakpoint(file, line) {
    if (this.breakpoints.has(file)) {
      this.breakpoints.get(file).delete(line);
      console.log(`❌ Breakpoint removido de ${file}:${line}`);
    }
  }

  /**
   * Lista todos os breakpoints
   */
  listBreakpoints() {
    console.log('🔴 Breakpoints ativos:');
    
    if (this.breakpoints.size === 0) {
      console.log('  Nenhum breakpoint definido');
      return;
    }

    this.breakpoints.forEach((lines, file) => {
      lines.forEach(line => {
        console.log(`  📍 ${file}:${line}`);
      });
    });
  }

  /**
   * Adiciona variável para monitorar
   * @param {string} variable - Nome da variável
   */
  watch(variable) {
    this.watchlist.add(variable);
    console.log(`👁️  Monitorando variável: ${variable}`);
  }

  /**
   * Remove variável do monitoramento
   * @param {string} variable - Nome da variável
   */
  unwatch(variable) {
    this.watchlist.delete(variable);
    console.log(`🚫 Parou de monitorar: ${variable}`);
  }

  /**
   * Lista variáveis monitoradas
   */
  listWatchlist() {
    console.log('👁️  Variáveis monitoradas:');
    
    if (this.watchlist.size === 0) {
      console.log('  Nenhuma variável sendo monitorada');
      return;
    }

    this.watchlist.forEach(variable => {
      console.log(`  📊 ${variable}`);
    });
  }

  /**
   * Executa arquivo em modo debug
   * @param {string} filePath - Caminho do arquivo .gs
   */
  async debug(filePath) {
    try {
      console.log(`🐛 Iniciando debug: ${filePath}\n`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }

      const code = fs.readFileSync(filePath, 'utf8');
      const instrumentedCode = this.instrumentCode(code, filePath);
      
      // Compilar código instrumentado
      const result = this.compiler.compile(instrumentedCode, filePath);

      if (!result.success) {
        console.error('❌ Erro na compilação para debug:');
        if (result.errors) {
          result.errors.forEach(error => console.error(`  • ${error.message}`));
        }
        return;
      }

      console.log('🚀 Executando em modo debug...\n');
      console.log('📋 Comandos de debug:');
      console.log('  • continue (c) - Continuar execução');
      console.log('  • step (s) - Próxima linha');
      console.log('  • vars (v) - Mostrar variáveis');
      console.log('  • stack - Mostrar call stack');
      console.log('  • quit (q) - Sair do debug');
      console.log('');

      // Executar com debug
      await this.executeWithDebug(result.javascript, filePath);

    } catch (error) {
      console.error(`❌ Erro no debug: ${error.message}`);
    }
  }

  /**
   * Instrumenta código com pontos de debug
   * @private
   */
  instrumentCode(code, filePath) {
    const lines = code.split('\\n');
    const instrumentedLines = [];

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      const trimmedLine = line.trim();
      
      // Pular linhas vazias e comentários
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        instrumentedLines.push(line);
        return;
      }

      // Adicionar ponto de debug antes da linha
      const debugPoint = `__debug_point("${filePath}", ${lineNumber}, \`${line.replace(/\`/g, '\\\\`')}\`);`;
      
      instrumentedLines.push(debugPoint);
      instrumentedLines.push(line);
    });

    return instrumentedLines.join('\\n');
  }

  /**
   * Executa JavaScript com debug ativo
   * @private
   */
  async executeWithDebug(jsCode, filePath) {
    // Preparar contexto de debug
    const debugContext = {
      __debug_point: this.handleDebugPoint.bind(this),
      __debug_vars: {},
      console: console,
      setTimeout: setTimeout,
      Math: Math,
      Date: Date,
      // Adicionar métodos goianos
      prosa: (...args) => {
        console.log('📤', ...args);
      },
      prosa_erro: (...args) => {
        console.error('🚨', ...args);  
      },
      prosa_aviso: (...args) => {
        console.warn('⚠️ ', ...args);
      }
    };

    try {
      // Executar no contexto de debug
      const execFunction = new Function('context', `
        with(context) {
          ${jsCode}
        }
      `);
      
      execFunction(debugContext);
      
    } catch (error) {
      console.error('❌ Erro na execução:', error.message);
      console.error('📍 Stack trace:');
      console.error(error.stack);
    }
  }

  /**
   * Manipula pontos de debug durante execução
   * @private
   */
  async handleDebugPoint(file, line, originalCode) {
    // Verificar se há breakpoint nesta linha
    const hasBreakpoint = this.breakpoints.has(file) && 
                         this.breakpoints.get(file).has(line);

    if (hasBreakpoint || this.stepMode) {
      console.log(`\\n🔴 Parado em ${file}:${line}`);
      console.log(`📝 Código: ${originalCode.trim()}`);
      
      // Mostrar variáveis monitoradas
      this.showWatchedVariables();
      
      // Aguardar comando do usuário
      await this.waitForDebugCommand();
    }
  }

  /**
   * Mostra valores das variáveis monitoradas
   * @private
   */
  showWatchedVariables() {
    if (this.watchlist.size === 0) return;

    console.log('\\n👁️  Variáveis monitoradas:');
    this.watchlist.forEach(variable => {
      try {
        // Simular valor da variável (na implementação real, extrair do contexto)
        const value = this.getVariableValue(variable);
        console.log(`  📊 ${variable} = ${this.formatValue(value)}`);
      } catch (error) {
        console.log(`  ❓ ${variable} = <não definida>`);
      }
    });
  }

  /**
   * Obter valor de variável (simulado por enquanto)
   * @private
   */
  getVariableValue(variable) {
    // Na implementação real, extrair do contexto de execução
    const mockValues = {
      'nome': '"João"',
      'idade': '25',
      'ativo': 'certeza',
      'numeros': '[1, 2, 3, 4, 5]'
    };
    
    return mockValues[variable] || '<valor desconhecido>';
  }

  /**
   * Formatar valor para exibição
   * @private
   */
  formatValue(value) {
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value, null, 2);
  }

  /**
   * Aguarda comando de debug do usuário
   * @private
   */
  async waitForDebugCommand() {
    return new Promise((resolve) => {
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const promptUser = () => {
        rl.question('🐛 debug> ', (input) => {
          const command = input.trim().toLowerCase();
          
          switch (command) {
            case 'c':
            case 'continue':
              this.stepMode = false;
              console.log('▶️  Continuando execução...');
              rl.close();
              resolve();
              break;
              
            case 's':
            case 'step':
              this.stepMode = true;
              console.log('👣 Modo step ativado');
              rl.close();
              resolve();
              break;
              
            case 'v':
            case 'vars':
              this.showAllVariables();
              promptUser();
              break;
              
            case 'stack':
              this.showCallStack();
              promptUser();
              break;
              
            case 'breakpoints':
            case 'bp':
              this.listBreakpoints();
              promptUser();
              break;
              
            case 'q':
            case 'quit':
              console.log('🛑 Saindo do debug...');
              rl.close();
              process.exit(0);
              break;
              
            default:
              console.log('❓ Comando desconhecido. Use: continue, step, vars, stack, breakpoints, quit');
              promptUser();
          }
        });
      };

      promptUser();
    });
  }

  /**
   * Mostra todas as variáveis do contexto
   * @private
   */
  showAllVariables() {
    console.log('\\n📋 Variáveis no contexto atual:');
    
    // Simular variáveis (na implementação real, extrair do contexto)
    const mockVariables = {
      'mensagem': '"Oi sô!"',
      'numero': '42',
      'ativo': 'certeza',
      'lista': '[1, 2, 3]',
      'objeto': '{ nome: "João", idade: 30 }'
    };
    
    Object.entries(mockVariables).forEach(([name, value]) => {
      console.log(`  📦 ${name}: ${value}`);
    });
  }

  /**
   * Mostra call stack atual
   * @private
   */
  showCallStack() {
    console.log('\\n📚 Call Stack:');
    
    if (this.callStack.length === 0) {
      console.log('  📍 main() - linha atual');
    } else {
      this.callStack.forEach((frame, index) => {
        console.log(`  ${index}: ${frame.function}() em ${frame.file}:${frame.line}`);
      });
    }
  }

  /**
   * Gera relatório de debug
   */
  generateDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      breakpoints: Array.from(this.breakpoints.entries()).map(([file, lines]) => ({
        file,
        lines: Array.from(lines)
      })),
      watchlist: Array.from(this.watchlist),
      callStack: this.callStack.slice()
    };

    const reportPath = 'debug-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📄 Relatório de debug salvo: ${reportPath}`);
    return report;
  }

  /**
   * Carrega configuração de debug
   * @param {string} configPath - Caminho do arquivo de config
   */
  loadDebugConfig(configPath) {
    try {
      if (!fs.existsSync(configPath)) {
        console.warn(`⚠️  Arquivo de config não encontrado: ${configPath}`);
        return;
      }

      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Carregar breakpoints
      if (config.breakpoints) {
        config.breakpoints.forEach(bp => {
          bp.lines.forEach(line => {
            this.addBreakpoint(bp.file, line);
          });
        });
      }

      // Carregar watchlist
      if (config.watchlist) {
        config.watchlist.forEach(variable => {
          this.watch(variable);
        });
      }

      console.log(`✅ Configuração de debug carregada: ${configPath}`);
      
    } catch (error) {
      console.error(`❌ Erro ao carregar config: ${error.message}`);
    }
  }
}

module.exports = GoianoDebugger;