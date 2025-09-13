#!/usr/bin/env node

const { program } = require('commander');
const GoianoDebugger = require('../src/debug/GoianoDebugger');

// ASCII Art do GSDebug
const logo = `
 ██████╗ ███████╗██████╗ ███████╗██████╗ ██╗   ██╗ ██████╗ 
██╔════╝ ██╔════╝██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝ 
██║  ███╗███████╗██║  ██║█████╗  ██████╔╝██║   ██║██║  ███╗
██║   ██║╚════██║██║  ██║██╔══╝  ██╔══██╗██║   ██║██║   ██║
╚██████╔╝███████║██████╔╝███████╗██████╔╝╚██████╔╝╚██████╔╝
 ╚═════╝ ╚══════╝╚═════╝ ╚══════╝╚═════╝  ╚═════╝  ╚═════╝ 
                                                            
🇧🇷 GoiásScript Debugger v2.0 - Debug Goiano Nativo!
`;

class GSDebugCLI {
  constructor() {
    this.debugger = new GoianoDebugger();
  }

  async debug(filePath, options) {
    try {
      // Carregar configuração se especificada
      if (options.config) {
        this.debugger.loadDebugConfig(options.config);
      }

      // Adicionar breakpoints da linha de comando
      if (options.breakpoint) {
        const breakpoints = Array.isArray(options.breakpoint) ? 
          options.breakpoint : [options.breakpoint];
        
        breakpoints.forEach(bp => {
          if (bp.includes(':')) {
            const [file, line] = bp.split(':');
            this.debugger.addBreakpoint(file, parseInt(line));
          } else {
            this.debugger.addBreakpoint(filePath, parseInt(bp));
          }
        });
      }

      // Adicionar variáveis para monitorar
      if (options.watch) {
        const variables = Array.isArray(options.watch) ? 
          options.watch : [options.watch];
        
        variables.forEach(variable => {
          this.debugger.watch(variable);
        });
      }

      // Iniciar debug
      await this.debugger.debug(filePath);

    } catch (error) {
      console.error(`❌ Erro no debug: ${error.message}`);
      process.exit(1);
    }
  }

  addBreakpoint(file, line) {
    this.debugger.addBreakpoint(file, parseInt(line));
  }

  removeBreakpoint(file, line) {
    this.debugger.removeBreakpoint(file, parseInt(line));
  }

  listBreakpoints() {
    this.debugger.listBreakpoints();
  }

  watch(variable) {
    this.debugger.watch(variable);
  }

  unwatch(variable) {
    this.debugger.unwatch(variable);
  }

  listWatchlist() {
    this.debugger.listWatchlist();
  }

  generateReport() {
    const report = this.debugger.generateDebugReport();
    console.log('📊 Relatório gerado com sucesso!');
    console.log(`📄 Arquivo: debug-report.json`);
  }

  info() {
    console.log(logo);
    console.log('GSDebug - Debugger Nativo GoiásScript');
    console.log('Versão: 2.0.0');
    console.log('');
    console.log('🐛 Recursos de Debug:');
    console.log('  • Breakpoints em linhas específicas');
    console.log('  • Monitoramento de variáveis (watchlist)');
    console.log('  • Execução passo a passo (step mode)');
    console.log('  • Call stack e contexto de variáveis');
    console.log('  • Configurações salvas em arquivo');
    console.log('');
    console.log('📋 Comandos durante debug:');
    console.log('  • continue (c) - Continuar execução');
    console.log('  • step (s) - Próxima linha');
    console.log('  • vars (v) - Mostrar variáveis');
    console.log('  • stack - Mostrar call stack');
    console.log('  • breakpoints - Listar breakpoints');
    console.log('  • quit (q) - Sair');
    console.log('');
  }
}

// Configuração do CLI
const cli = new GSDebugCLI();

program
  .name('gsdebug')
  .description('🇧🇷 GoiásScript Debugger - Debug Goiano Nativo!')
  .version('2.0.0');

// Comando principal: debug
program
  .command('debug')
  .description('Executa arquivo em modo debug')
  .argument('<file>', 'Arquivo .gs para debugar')
  .option('-b, --breakpoint <line>', 'Adicionar breakpoint em linha', [])
  .option('-w, --watch <variable>', 'Monitorar variável', [])
  .option('-c, --config <file>', 'Arquivo de configuração de debug')
  .action(async (file, options) => {
    await cli.debug(file, options);
  });

// Comando: add-breakpoint
program
  .command('add-bp')
  .description('Adiciona breakpoint')
  .argument('<file>', 'Arquivo')
  .argument('<line>', 'Linha')
  .action((file, line) => {
    cli.addBreakpoint(file, line);
  });

// Comando: remove-breakpoint
program
  .command('remove-bp')
  .description('Remove breakpoint')
  .argument('<file>', 'Arquivo')
  .argument('<line>', 'Linha')
  .action((file, line) => {
    cli.removeBreakpoint(file, line);
  });

// Comando: list-breakpoints
program
  .command('list-bp')
  .description('Lista breakpoints')
  .action(() => {
    cli.listBreakpoints();
  });

// Comando: watch
program
  .command('watch')
  .description('Adiciona variável ao monitoramento')
  .argument('<variable>', 'Nome da variável')
  .action((variable) => {
    cli.watch(variable);
  });

// Comando: unwatch
program
  .command('unwatch')
  .description('Remove variável do monitoramento')
  .argument('<variable>', 'Nome da variável')
  .action((variable) => {
    cli.unwatch(variable);
  });

// Comando: list-watch
program
  .command('list-watch')
  .description('Lista variáveis monitoradas')
  .action(() => {
    cli.listWatchlist();
  });

// Comando: report
program
  .command('report')
  .description('Gera relatório de debug')
  .action(() => {
    cli.generateReport();
  });

// Comando: info
program
  .command('info')
  .description('Mostra informações sobre GSDebug')
  .action(() => {
    cli.info();
  });

// Parse dos argumentos
program.parse();

// Se nenhum comando foi especificado, mostrar ajuda
if (!process.argv.slice(2).length) {
  console.log(logo);
  program.outputHelp();
}