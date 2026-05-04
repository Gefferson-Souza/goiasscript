#!/usr/bin/env node

const readline = require('readline');
const util = require('util');
const GoiasScriptCompiler = require('../src/compiler');

/**
 * Roda de Prosa GoiásScript - Terminal Interativo Goiano
 * Terminal interativo para testar código GoiásScript
 */
class RodaDeProsa {
  constructor() {
    this.compiler = new GoiasScriptCompiler();
    this.história = [];
    this.variables = new Map();
    this.multilineBuffer = '';
    this.multilineMode = false;
    this.promptPrefix = 'goiás> ';
    this.multilinePrefix = '    ... ';
    
    // Configurar readline
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: this.promptPrefix
    });

    this.setupRodaDeProsa();
  }

  setupRodaDeProsa() {
    console.log(this.getMensagemBoasVindas());
    
    this.rl.prompt();

    this.rl.on('line', (input) => {
      this.handleInput(input.trim());
    });

    this.rl.on('close', () => {
      this.cabô_a_prosa();
    });

    // Configurar autocompletar
    this.rl.on('completer', this.autocomplete.bind(this));
  }

  getMensagemBoasVindas() {
    return `
 ██████╗  ██████╗ ██╗ █████╗ ███████╗    ██████╗ ███████╗██████╗ ██╗
██╔════╝ ██╔═══██╗██║██╔══██╗██╔════╝    ██╔══██╗██╔════╝██╔══██╗██║
██║  ███╗██║   ██║██║███████║███████╗    ██████╔╝█████╗  ██████╔╝██║
██║   ██║██║   ██║██║██╔══██║╚════██║    ██╔══██╗██╔════╝██╔═══╝ ██║
╚██████╔╝╚██████╔╝██║██║  ██║███████║    ██║  ██║███████╗██║     ███████╗
 ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚══════╝╚═╝     ╚══════╝

🇧🇷 Roda de Prosa do GoiásScript v2.0!

💡 Comandos especiais: .desenrola, .mostra_os_trem, .zera_o_trem, .vaza

🎯 Pode começar a prosa, sô!
`;
  }

  async handleInput(input) {
    try {
      // Comandos especiais da Roda de Prosa
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
      console.error('❌ Ô rapaz! Deu ruim:', error.message);
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
      this.multilineBuffer += '\n' + input;
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
      // Adicionar à história
      this.história.push(code);
      
      // Compilar e executar
      const result = this.compiler.compile(code, 'repl.gs');
      
      if (!result.success) {
        console.error('❌ Ô rapaz! Deu ruim na tradução:');
        if (result.errors) {
          result.errors.forEach(error => console.error(`  • ${error.message}`));
        }
        return;
      }

      // Mostrar warnings se houver
      if (result.warnings && result.warnings.length > 0) {
        console.warn('⚠️  Avisos:');
        result.warnings.forEach(warning => {
          console.warn(`  • ${warning.message}`);
        });
      }

      // Executar JavaScript gerado
      const evalResult = this.safeEval(result.javascript);
      
      // Mostrar resultado se não for undefined
      if (evalResult !== undefined) {
        console.log('💬', this.formatOutput(evalResult));
      }

    } catch (error) {
      console.error('❌ Ô rapaz! Deu ruim na execução:', error.message);
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
      case '.desenrola':
      case '.help':
        this.desenrola();
        break;
        
      case '.mostra_os_trem':
      case '.vars':
        this.mostra_os_trem();
        break;
        
      case '.lembra_aí':
      case '.history':
        this.lembra_aí();
        break;
        
      case '.limpa_o_terreiro':
      case '.clear':
        console.clear();
        console.log('🧹 Terreiro limpo, sô!');
        break;
        
      case '.zera_o_trem':
      case '.reset':
        this.zera_o_trem();
        break;
        
      case '.vaza':
      case '.cabô_a_prosa':
      case '.exit':
        this.cabô_a_prosa();
        break;
        
      case '.mostra_as_tralha':
      case '.packages':
        this.mostra_as_tralha();
        break;
        
      case '.methods':
        this.mostra_métodos_goianos();
        break;
        
      default:
        console.log(`❓ Não entendi esse comando: ${command}`);
        console.log('💡 Digite .desenrola para ver os comandos disponíveis');
    }
  }

  desenrola() {
    console.log(`
🇧🇷 Roda de Prosa GoiásScript - Comandos Disponíveis:

📋 Comandos da Prosa:
   .desenrola           - Desenrola esse trem (ajuda)
   .mostra_os_trem      - Mostra as variáveis na memória  
   .lembra_aí           - Lembra o que já conversamos (histórico)
   .limpa_o_terreiro    - Limpa a tela
   .zera_o_trem         - Zera tudo e começa de novo
   .vaza               - Vaza daqui (sair)
   .mostra_as_tralha   - Mostra os balaios instalados
   
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
   "texto".gritando()
   GoianoMath.sorteia_um()
   
💡 Use Enter para executar. Para blocos multilinhas, termine com }
`);
  }

  mostra_os_trem() {
    console.log('📋 Variáveis na prosa:');
    
    if (this.variables.size === 0) {
      console.log('  Nenhuma variável ainda, sô');
    } else {
      this.variables.forEach((value, name) => {
        console.log(`  📦 ${name}: ${this.formatOutput(value)}`);
      });
    }
  }

  lembra_aí() {
    console.log('📚 Lembrando o que já conversamos:');
    
    if (this.história.length === 0) {
      console.log('  Ainda não conversamos nada');
    } else {
      this.história.forEach((cmd, index) => {
        console.log(`  ${index + 1}: ${cmd}`);
      });
    }
  }

  zera_o_trem() {
    this.história = [];
    this.variables.clear();
    this.multilineBuffer = '';
    this.multilineMode = false;
    
    console.log('🔄 Zerou tudo, sô!');
    console.log('✨ Histórico e variáveis limpinhos');
  }

  cabô_a_prosa() {
    console.log('\n🇧🇷 Tchau, sô! Volte sempre pra mais dois dedo de prosa!');
    console.log('✨ Obrigado por usar a Roda de Prosa GoiásScript!');
    process.exit(0);
  }

  mostra_as_tralha() {
    console.log('🧺 Balaios GoiásScript disponíveis:');
    console.log('');
    console.log('  Built-in:');
    console.log('  • goiano-utils - Utilitários essenciais');
    console.log('  • goiano-http - Cliente HTTP');
    console.log('  • goiano-db - Banco de dados');
    console.log('');
    console.log('💡 Use: gs-balaio pega <balaio> para pegar');
  }

  mostra_métodos_goianos() {
    console.log('🔧 Métodos Goianos Disponíveis:');
    console.log('');
    console.log('📝 Texto (String):');
    console.log('  • .gritando(), .cochichando(), .aparar()');
    console.log('  • .dividir(), .trocar(), .tem_no_meio(), .tamanho()');
    console.log('');
    console.log('📋 Lista (Array):');
    console.log('  • .mapear(), .filtrar(), .reduzir(), .pra_cada()');
    console.log('  • .bota_no_final(), .arranca_o_rabo(), .ordenar()');
    console.log('');
    console.log('🧮 GoianoMath:');
    console.log('  • .sorteia_um(), .arredondar(), .maior(), .menor()');
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
      'gritando', 'cochichando', 'dividir', 'trocar', 'tem_no_meio',
      'mapear', 'filtrar', 'reduzir', 'bota_no_final', 'sorteia_um', 'arredondar'
    ];

    const allCompletions = [...keywords, ...methods];
    const hits = allCompletions.filter(c => c.startsWith(line));
    
    return [hits.length ? hits : allCompletions, line];
  }
}

// Iniciar Roda de Prosa
if (require.main === module) {
  new RodaDeProsa();
}

module.exports = RodaDeProsa;