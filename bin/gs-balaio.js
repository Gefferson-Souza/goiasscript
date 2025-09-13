#!/usr/bin/env node

const { program } = require('commander');
const GoianoPackageManager = require('../src/packages/PackageManager');

// ASCII Art do GS-Balaio
const logo = `
██████╗  █████╗ ██╗      █████╗ ██╗ ██████╗ 
██╔══██╗██╔══██╗██║     ██╔══██╗██║██╔═══██╗
██████╔╝███████║██║     ███████║██║██║   ██║
██╔══██╗██╔══██║██║     ██╔══██║██║██║   ██║
██████╔╝██║  ██║███████╗██║  ██║██║╚██████╔╝
╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝ 
                                           
🧺 GS-Balaio v2.0 - Gerenciador de Balaios Goianos!
`;

class GSBalaioCLI {
  constructor() {
    this.packageManager = new GoianoPackageManager();
  }

  async pega(packageName, options) {
    try {
      await this.packageManager.install(packageName, options.version);
    } catch (error) {
      process.exit(1);
    }
  }

  async joga_fora(packageName) {
    try {
      await this.packageManager.uninstall(packageName);
    } catch (error) {
      process.exit(1);
    }
  }

  async mostra_os_balaio() {
    try {
      await this.packageManager.list();
    } catch (error) {
      process.exit(1);
    }
  }

  async arruma_um(packageName) {
    try {
      await this.packageManager.create(packageName);
    } catch (error) {
      process.exit(1);
    }
  }

  async leva_pra_feira(options) {
    try {
      await this.packageManager.publish(options.path);
    } catch (error) {
      process.exit(1);
    }
  }

  dedo_de_prosa() {
    console.log(logo);
    console.log('GS-Balaio - Gerenciador de Balaios GoiásScript');
    console.log('Versão: 2.0.0');
    console.log('Feira: feira.goiasscript.com (futuro)');
    console.log();
    console.log('🧺 Balaios built-in disponíveis:');
    console.log('  • goiano-utils - Utilitários essenciais');
    console.log('  • goiano-http - Cliente HTTP');  
    console.log('  • goiano-db - Banco de dados');
    console.log();
  }
}

// Configuração do CLI
const cli = new GSBalaioCLI();

program
  .name('gs-balaio')
  .description('🧺 GS-Balaio - Gerenciador de Balaios Goianos!')
  .version('2.0.0');

// Comando: pega (install)
program
  .command('pega')
  .alias('p')
  .description('Pega um balaio da feira')
  .argument('<balaio>', 'Nome do balaio para pegar')
  .option('-v, --version <version>', 'Versão específica', 'latest')
  .action(async (packageName, options) => {
    await cli.pega(packageName, options);
  });

// Comando: install (alias para pega - compatibilidade)
program
  .command('install')
  .alias('i')
  .description('Pega um balaio da feira (alias para pega)')
  .argument('<balaio>', 'Nome do balaio para pegar')
  .option('-v, --version <version>', 'Versão específica', 'latest')
  .action(async (packageName, options) => {
    await cli.pega(packageName, options);
  });

// Comando: joga_fora (uninstall)
program
  .command('joga_fora')
  .alias('jf')
  .description('Joga um balaio fora')
  .argument('<balaio>', 'Nome do balaio para jogar fora')
  .action(async (packageName) => {
    await cli.joga_fora(packageName);
  });

// Comando: uninstall (alias para joga_fora - compatibilidade)
program
  .command('uninstall')
  .alias('remove')
  .alias('rm')
  .description('Joga um balaio fora (alias para joga_fora)')
  .argument('<balaio>', 'Nome do balaio para jogar fora')
  .action(async (packageName) => {
    await cli.joga_fora(packageName);
  });

// Comando: mostra_os_balaio (list)
program
  .command('mostra_os_balaio')
  .alias('mob')
  .description('Mostra os balaios que você tem')
  .action(async () => {
    await cli.mostra_os_balaio();
  });

// Comando: list (alias para mostra_os_balaio - compatibilidade)
program
  .command('list')
  .alias('ls')
  .description('Mostra os balaios que você tem (alias para mostra_os_balaio)')
  .action(async () => {
    await cli.mostra_os_balaio();
  });

// Comando: arruma_um (create)
program
  .command('arruma_um')
  .alias('au')
  .description('Arruma um balaio novo')
  .argument('<name>', 'Nome do balaio')
  .action(async (packageName) => {
    await cli.arruma_um(packageName);
  });

// Comando: create (alias para arruma_um - compatibilidade)
program
  .command('create')
  .description('Arruma um balaio novo (alias para arruma_um)')
  .argument('<name>', 'Nome do balaio')
  .action(async (packageName) => {
    await cli.arruma_um(packageName);
  });

// Comando: leva_pra_feira (publish)
program
  .command('leva_pra_feira')
  .alias('lpf')
  .description('Leva seu balaio pra feira')
  .option('-p, --path <path>', 'Caminho do balaio', process.cwd())
  .action(async (options) => {
    await cli.leva_pra_feira(options);
  });

// Comando: publish (alias para leva_pra_feira - compatibilidade)
program
  .command('publish')
  .description('Leva seu balaio pra feira (alias para leva_pra_feira)')
  .option('-p, --path <path>', 'Caminho do balaio', process.cwd())
  .action(async (options) => {
    await cli.leva_pra_feira(options);
  });

// Comando: dedo_de_prosa (info)
program
  .command('dedo_de_prosa')
  .alias('ddp')
  .description('Dá um dedo de prosa sobre o GS-Balaio')
  .action(() => {
    cli.dedo_de_prosa();
  });

// Comando: info (alias para dedo_de_prosa - compatibilidade)
program
  .command('info')
  .description('Dá um dedo de prosa sobre o GS-Balaio (alias para dedo_de_prosa)')
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