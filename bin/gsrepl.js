#!/usr/bin/env node

const readline = require('readline');
const util = require('util');
const GoiasScriptCompiler = require('../src/compiler');

/**
 * GoiásScript REPL - Read-Eval-Print Loop Interativo
 * Terminal interativo para testar código GoiásScript
 */
class GoiasScriptREPL {
  constructor() {
    this.compiler = new GoiasScriptCompiler();
    this.history = [];
    this.variables = new Map();
    this.multilineBuffer = '';
    this.multilineMode = false;
    this.promptPrefix = '🇧🇷 goiás> ';
    this.multilinePrefix = '    ... ';
    
    // Configurar readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.promptPrefix
    });

    this.setupREPL();
  }

  setupREPL() {
    console.log(this.getWelcomeMessage());
    
    this.rl.prompt();

    this.rl.on('line', (input) => {
      this.handleInput(input.trim());
    });

    this.rl.on('close', () => {
      this.handleExit();
    });

    // Configurar autocompletar
    this.rl.on('completer', this.autocomplete.bind(this));
  }

  getWelcomeMessage() {
    return `
 ██████╗  ██████╗ ██╗ █████╗ ███████╗    ██████╗ ███████╗██████╗ ██╗     
██╔════╝ ██╔═══██╗██║██╔══██╗██╔════╝    ██╔══██╗██╔════╝██╔══██╗██║     
██║  ███╗██║   ██║██║███████║███████╗    ██████╔╝█████╗  ██████╔╝██║     
██║   ██║██║   ██║██║██╔══██║╚════██║    ██╔══██╗██╔════╝██╔═══╝ ██║     
╚██████╔╝╚██████╔╝██║██║  ██║███████║    ██║  ██║███████╗██║     ███████╗
 ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝

🇧🇷 GoiásScript REPL v2.0 - Terminal Interativo Goiano!

💡 Comandos especiais:
   .help     - Mostra ajuda
   .vars     - Lista variáveis
   .history  - Mostra histórico
   .clear    - Limpa tela
   .reset    - Reinicia sessão
   .exit     - Sair

🎯 Digite código GoiásScript e pressione Enter para executar!
`;
  }

  async handleInput(input) {
    try {
      // Comandos especiais do REPL
      if (input.startsWith('.')) {
        this.handleCommand(input);
        this.rl.prompt();
        return;
      }

      // Verificar se é linha vazia
      if (!input) {
        this.rl.prompt();
        return;
      }

      // Detectar modo multilinha
      if (this.isMultilineStart(input) || this.multilineMode) {
        this.handleMultiline(input);
        return;
      }

      // Executar código
      await this.executeCode(input);
      
    } catch (error) {
      console.error('❌ Erro:', error.message);
    }

    this.rl.prompt();
  }

  isMultilineStart(input) {
    const multilineKeywords = [
      'faz_trem', 'vai_na_frente_faz_trem', 'se', 'se_ocê_quiser', 
      'enquanto_tiver', 'vai_indo', 'tenta_aí', 'arruma_trem'
    ];
    
    return multilineKeywords.some(keyword => input.includes(keyword)) && 
           input.includes('{') && !input.includes('}');
  }

  handleMultiline(input) {
    if (!this.multilineMode) {
      this.multilineMode = true;
      this.multilineBuffer = input;
      this.rl.setPrompt(this.multilinePrefix);
    } else {
      this.multilineBuffer += '\\n' + input;
    }

    // Verificar se chegou ao final do bloco
    if (input.includes('}') || input === '') {
      this.executeCode(this.multilineBuffer);
      this.multilineMode = false;
      this.multilineBuffer = '';
      this.rl.setPrompt(this.promptPrefix);
    }
    
    this.rl.prompt();
  }

  async executeCode(code) {
    try {
      // Adicionar ao histórico
      this.history.push(code);
      
      // Compilar e executar
      const result = this.compiler.compile(code, 'repl.gs');
      
      if (!result.success) {
        console.error('❌ Erro de compilação:');
        if (result.errors) {
          result.errors.forEach(error => console.error(`  • ${error.message}`));
        }
        return;
      }

      // Mostrar warnings se houver
      if (result.warnings && result.warnings.length > 0) {
        console.warn('⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.warn(`  • ${warning.message}`);
        });
      }

      // Executar JavaScript gerado
      const evalResult = this.safeEval(result.javascript);
      
      // Mostrar resultado se não for undefined
      if (evalResult !== undefined) {
        console.log('📤', this.formatOutput(evalResult));
      }

    } catch (error) {
      console.error('❌ Erro na execução:', error.message);
    }
  }

  safeEval(code) {
    try {
      // Criar contexto isolado para execução
      const context = {
        console: console,
        setTimeout: setTimeout,
        setInterval: setInterval,
        clearTimeout: clearTimeout,
        clearInterval: clearInterval,
        Date: Date,
        Math: Math,
        JSON: JSON,
        ...this.getGlobalVariables()
      };

      // Executar código no contexto
      return eval(`(function() { ${code} })()`);
      
    } catch (error) {
      throw new Error(`Erro de execução: ${error.message}`);
    }
  }

  getGlobalVariables() {
    // Retornar variáveis que devem estar disponíveis globalmente
    const globals = {};
    
    // Adicionar métodos goianos
    globals.prosa = console.log;
    globals.prosa_erro = console.error;
    globals.prosa_aviso = console.warn;
    
    return globals;
  }

  formatOutput(value) {
    if (typeof value === 'object') {
      return util.inspect(value, { 
        colors: true, 
        depth: 3,
        compact: false 
      });
    }
    return value;
  }

  handleCommand(command) {
    const cmd = command.toLowerCase();
    
    switch (cmd) {
      case '.help':
        this.showHelp();
        break;
        
      case '.vars':
        this.showVariables();
        break;
        
      case '.history':
        this.showHistory();
        break;
        
      case '.clear':
        console.clear();
        console.log('🧹 Tela limpa!');
        break;
        
      case '.reset':
        this.resetSession();
        break;
        
      case '.exit':
        this.handleExit();
        break;
        
      case '.packages':
        this.showPackages();
        break;
        
      case '.methods':
        this.showGoianoMethods();
        break;
        
      default:
        console.log(`❓ Comando desconhecido: ${command}`);
        console.log('💡 Digite .help para ver comandos disponíveis');
    }
  }

  showHelp() {
    console.log(`
🇧🇷 GoiásScript REPL - Comandos Disponíveis:

📋 Comandos do REPL:
   .help       - Mostra esta ajuda
   .vars       - Lista variáveis em memória
   .history    - Mostra histórico de comandos
   .clear      - Limpa a tela
   .reset      - Reinicia sessão (limpa variáveis)
   .exit       - Sair do REPL
   .packages   - Lista packages instalados
   .methods    - Mostra métodos goianos disponíveis

🎯 Exemplos de código GoiásScript:

   Variáveis:
   uai nome é "João"
   trem idade é 25
   
   Funções:
   faz_trem saudar(nome) {
     faz_favor "Oi " mais nome
   }
   
   Arrays:
   uai numeros é [1, 2, 3]
   numeros.mapear(x => x vezes 2)
   
   Métodos goianos:
   "texto".pra_maiusculo()
   GoianoMath.sorteio()
   
💡 Use Enter para executar. Para blocos multilinhas, termine com }
`);
  }

  showVariables() {
    console.log('📋 Variáveis em memória:');
    
    if (this.variables.size === 0) {
      console.log('  Nenhuma variável definida');
    } else {
      this.variables.forEach((value, name) => {
        console.log(`  📦 ${name}: ${this.formatOutput(value)}`);
      });
    }
  }

  showHistory() {
    console.log('📚 Histórico de comandos:');
    
    if (this.history.length === 0) {
      console.log('  Nenhum comando executado');
    } else {
      this.history.forEach((cmd, index) => {
        console.log(`  ${index + 1}: ${cmd}`);
      });
    }
  }

  resetSession() {
    this.history = [];
    this.variables.clear();
    this.multilineBuffer = '';
    this.multilineMode = false;
    
    console.log('🔄 Sessão reiniciada!');
    console.log('✨ Histórico e variáveis limpos');
  }

  handleExit() {
    console.log('\\n🇧🇷 Tchau, sô! Volte sempre!');
    console.log('✨ Obrigado por usar GoiásScript REPL!');
    process.exit(0);
  }

  showPackages() {
    console.log('📦 Packages GoiásScript disponíveis:');
    console.log('');
    console.log('  Built-in:');
    console.log('  • goiano-utils - Utilitários essenciais');
    console.log('  • goiano-http - Cliente HTTP');
    console.log('  • goiano-db - Banco de dados');
    console.log('');
    console.log('💡 Use: gspack install <package> para instalar');
  }

  showGoianoMethods() {
    console.log('🔧 Métodos Goianos Disponíveis:');
    console.log('');
    console.log('📝 Texto (String):');
    console.log('  • .pra_maiusculo(), .pra_minusculo(), .aparar()');
    console.log('  • .dividir(), .trocar(), .contem(), .tamanho()');
    console.log('');
    console.log('📋 Lista (Array):');
    console.log('  • .mapear(), .filtrar(), .reduzir(), .pra_cada()');
    console.log('  • .empurrar(), .tirar_ultimo(), .ordenar()');
    console.log('');
    console.log('🧮 GoianoMath:');
    console.log('  • .sorteio(), .arredondar(), .maior(), .menor()');
    console.log('  • .potencia(), .raiz_quadrada(), .absoluto()');
    console.log('');
    console.log('🌍 Globais:');
    console.log('  • prosa(), vira_numero(), depois_de()');
  }

  autocomplete(line) {
    const keywords = [
      'uai', 'trem', 'é', 'faz_trem', 'faz_favor', 'se', 'senão',
      'enquanto_tiver', 'vai_indo', 'para', 'em', 'de', 'certeza',
      'de_jeito_nenhum', 'nada', 'prosa', 'GoianoMath', 'pega',
      'troca_ideia', 'vai_na_frente', 'espera_um_cadim'
    ];
    
    const methods = [
      'pra_maiusculo', 'pra_minusculo', 'dividir', 'trocar', 'contem',
      'mapear', 'filtrar', 'reduzir', 'empurrar', 'sorteio', 'arredondar'
    ];

    const allCompletions = [...keywords, ...methods];
    const hits = allCompletions.filter(c => c.startsWith(line));
    
    return [hits.length ? hits : allCompletions, line];
  }
}

// Iniciar REPL
if (require.main === module) {
  new GoiasScriptREPL();
}

module.exports = GoiasScriptREPL;