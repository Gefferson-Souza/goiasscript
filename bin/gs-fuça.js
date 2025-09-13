#!/usr/bin/env node

const { program } = require('commander');
const GoianoDebugger = require('../src/debug/GoianoDebugger');

// ASCII Art do GS-Fuçá
const logo = `
 ██████╗ ███████╗      ███████╗██╗   ██╗ ██████╗  █████╗ 
██╔════╝ ██╔════╝      ██╔════╝██║   ██║██╔════╝ ██╔══██╗
██║  ███╗███████╗█████╗█████╗  ██║   ██║██║      ███████║
██║   ██║╚════██║╚════╝██╔══╝  ██║   ██║██║      ██╔══██║
╚██████╔╝███████║      ██║     ╚██████╔╝╚██████╗ ██║  ██║
 ╚═════╝ ╚══════╝      ╚═╝      ╚═════╝  ╚═════╝ ╚═╝  ╚═╝
                                                          
🔍 GS-Fuçá v2.0 - Debugger Goiano que Fuça os Detalhes!
`;

class GSFuçaCLI {
  constructor() {
    this.debugger = new GoianoDebugger();
  }

  async fuça(filePath, options) {
    try {
      // Carregar configuração se especificada
      if (options.jeitão) {
        this.debugger.loadDebugConfig(options.jeitão);
      }

      // Adicionar arapucas (breakpoints) da linha de comando
      if (options.arapuca) {
        const arapucas = Array.isArray(options.arapuca) ? 
          options.arapuca : [options.arapuca];
        
        arapucas.forEach(arapuca => {
          if (arapuca.includes(':')) {
            const [file, line] = arapuca.split(':');
            this.debugger.addBreakpoint(file, parseInt(line));
          } else {
            this.debugger.addBreakpoint(filePath, parseInt(arapuca));
          }
        });
      }

      // Adicionar variáveis para ficar de olho
      if (options.de_olho) {
        const variables = Array.isArray(options.de_olho) ? 
          options.de_olho : [options.de_olho];
        
        variables.forEach(variable => {
          this.debugger.watch(variable);
        });
      }

      // Iniciar fuçada (debug)
      console.log('🔍 Começando a fuçar o código...\n');
      await this.debugger.debug(filePath);

    } catch (error) {
      console.error(`❌ Ô rapaz! Deu ruim na fuçada: ${error.message}`);
      process.exit(1);
    }
  }

  arma_arapuca(file, line) {
    console.log(`🪤 Armando arapuca no arquivo ${file}, linha ${line}...`);
    this.debugger.addBreakpoint(file, parseInt(line));
    console.log('✅ Arapuca armada com sucesso!');
  }

  desarma_arapuca(file, line) {
    console.log(`🪤 Desarmando arapuca no arquivo ${file}, linha ${line}...`);
    this.debugger.removeBreakpoint(file, parseInt(line));
    console.log('✅ Arapuca desarmada!');
  }

  lista_arapuca() {
    console.log('🪤 Listando arapucas armadas...\n');
    this.debugger.listBreakpoints();
  }

  de_olho(variable) {
    console.log(`👀 Ficando de olho na variável: ${variable}`);
    this.debugger.watch(variable);
    console.log('✅ Agora tô de olho!');
  }

  tira_o_olho(variable) {
    console.log(`👀 Tirando o olho da variável: ${variable}`);
    this.debugger.unwatch(variable);
    console.log('✅ Parei de olhar!');
  }

  lista_os_de_olho() {
    console.log('👀 Listando o que tô de olho...\n');
    this.debugger.listWatchlist();
  }

  dá_o_parecer() {
    console.log('📊 Preparando o parecer da fuçada...');
    const report = this.debugger.generateDebugReport();
    console.log('✅ Parecer gerado com sucesso!');
    console.log('📄 Arquivo: debug-report.json');
  }

  dedo_de_prosa() {
    console.log(logo);
    console.log('GS-Fuçá - Debugger Goiano que Fuça os Detalhes');
    console.log('Versão: 2.0.0');
    console.log('');
    console.log('🔍 Recursos de Fuçada:');
    console.log('  • Arapucas em linhas específicas (breakpoints)');
    console.log('  • Ficar de olho em variáveis (watchlist)');
    console.log('  • Execução um cadim de cada vez (step mode)');
    console.log('  • Ruma de chamadas e contexto (call stack)');
    console.log('  • Jeitão salvo em arquivo (configurações)');
    console.log('');
    console.log('📋 Comandos durante a fuçada:');
    console.log('  • toca_o_pau (c) - Continuar execução');
    console.log('  • um_cadim (s) - Próxima linha');
    console.log('  • mostra_os_trem (v) - Mostrar variáveis');
    console.log('  • mostra_a_ruma - Mostrar call stack');
    console.log('  • arapucas - Listar arapucas');
    console.log('  • vaza (q) - Sair');
    console.log('');
  }
}

// Configuração do CLI
const cli = new GSFuçaCLI();

program
  .name('gs-fuça')
  .description('🔍 GS-Fuçá - Debugger Goiano que Fuça os Detalhes!')
  .version('2.0.0');

// Comando principal: fuça (debug)
program
  .command('fuça')
  .description('Fuça um arquivo em modo debug')
  .argument('<file>', 'Arquivo .gs para fuçar')
  .option('-a, --arapuca <line>', 'Armar arapuca em linha', [])
  .option('-o, --de_olho <variable>', 'Ficar de olho em variável', [])
  .option('-j, --jeitão <file>', 'Arquivo de jeitão (configuração) de debug')
  .action(async (file, options) => {
    await cli.fuça(file, options);
  });

// Comando: debug (alias para fuça - compatibilidade)
program
  .command('debug')
  .description('Fuça um arquivo em modo debug (alias para fuça)')
  .argument('<file>', 'Arquivo .gs para fuçar')
  .option('-b, --breakpoint <line>', 'Armar arapuca em linha', [])
  .option('-w, --watch <variable>', 'Ficar de olho em variável', [])
  .option('-c, --config <file>', 'Arquivo de jeitão (configuração) de debug')
  .action(async (file, options) => {
    // Converter opções para formato goiano
    const goianoOptions = {
      arapuca: options.breakpoint,
      de_olho: options.watch,
      jeitão: options.config
    };
    await cli.fuça(file, goianoOptions);
  });

// Comando: arma_arapuca (add-breakpoint)
program
  .command('arma_arapuca')
  .alias('aa')
  .description('Arma uma arapuca (breakpoint)')
  .argument('<file>', 'Arquivo')
  .argument('<line>', 'Linha')
  .action((file, line) => {
    cli.arma_arapuca(file, line);
  });

// Comando: add-bp (alias para arma_arapuca - compatibilidade)
program
  .command('add-bp')
  .description('Arma uma arapuca (alias para arma_arapuca)')
  .argument('<file>', 'Arquivo')
  .argument('<line>', 'Linha')
  .action((file, line) => {
    cli.arma_arapuca(file, line);
  });

// Comando: desarma_arapuca (remove-breakpoint)
program
  .command('desarma_arapuca')
  .alias('da')
  .description('Desarma uma arapuca (breakpoint)')
  .argument('<file>', 'Arquivo')
  .argument('<line>', 'Linha')
  .action((file, line) => {
    cli.desarma_arapuca(file, line);
  });

// Comando: remove-bp (alias para desarma_arapuca - compatibilidade)
program
  .command('remove-bp')
  .description('Desarma uma arapuca (alias para desarma_arapuca)')
  .argument('<file>', 'Arquivo')
  .argument('<line>', 'Linha')
  .action((file, line) => {
    cli.desarma_arapuca(file, line);
  });

// Comando: lista_arapuca (list-breakpoints)
program
  .command('lista_arapuca')
  .alias('la')
  .description('Lista arapucas armadas')
  .action(() => {
    cli.lista_arapuca();
  });

// Comando: list-bp (alias para lista_arapuca - compatibilidade)
program
  .command('list-bp')
  .description('Lista arapucas armadas (alias para lista_arapuca)')
  .action(() => {
    cli.lista_arapuca();
  });

// Comando: de_olho (watch)
program
  .command('de_olho')
  .alias('do')
  .description('Fica de olho numa variável')
  .argument('<variable>', 'Nome da variável')
  .action((variable) => {
    cli.de_olho(variable);
  });

// Comando: watch (alias para de_olho - compatibilidade)
program
  .command('watch')
  .description('Fica de olho numa variável (alias para de_olho)')
  .argument('<variable>', 'Nome da variável')
  .action((variable) => {
    cli.de_olho(variable);
  });

// Comando: tira_o_olho (unwatch)
program
  .command('tira_o_olho')
  .alias('to')
  .description('Para de olhar uma variável')
  .argument('<variable>', 'Nome da variável')
  .action((variable) => {
    cli.tira_o_olho(variable);
  });

// Comando: unwatch (alias para tira_o_olho - compatibilidade)
program
  .command('unwatch')
  .description('Para de olhar uma variável (alias para tira_o_olho)')
  .argument('<variable>', 'Nome da variável')
  .action((variable) => {
    cli.tira_o_olho(variable);
  });

// Comando: lista_os_de_olho (list-watch)
program
  .command('lista_os_de_olho')
  .alias('lo')
  .description('Lista variáveis que tô de olho')
  .action(() => {
    cli.lista_os_de_olho();
  });

// Comando: list-watch (alias para lista_os_de_olho - compatibilidade)
program
  .command('list-watch')
  .description('Lista variáveis que tô de olho (alias para lista_os_de_olho)')
  .action(() => {
    cli.lista_os_de_olho();
  });

// Comando: dá_o_parecer (report)
program
  .command('dá_o_parecer')
  .alias('dp')
  .description('Dá o parecer da fuçada (gera relatório)')
  .action(() => {
    cli.dá_o_parecer();
  });

// Comando: report (alias para dá_o_parecer - compatibilidade)
program
  .command('report')
  .description('Dá o parecer da fuçada (alias para dá_o_parecer)')
  .action(() => {
    cli.dá_o_parecer();
  });

// Comando: dedo_de_prosa (info)
program
  .command('dedo_de_prosa')
  .alias('ddp')
  .description('Dá um dedo de prosa sobre o GS-Fuçá')
  .action(() => {
    cli.dedo_de_prosa();
  });

// Comando: info (alias para dedo_de_prosa - compatibilidade)
program
  .command('info')
  .description('Dá um dedo de prosa sobre o GS-Fuçá (alias para dedo_de_prosa)')
  .action(() => {
    cli.dedo_de_prosa();
  });

// Parse dos argumentos
program.parse();

// Se nenhum comando foi especificado, mostrar ajuda
if (!process.argv.slice(2).length) {
  console.log(logo);
  program.outputHelp();
}