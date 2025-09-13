#!/usr/bin/env node

const { program } = require('commander');
const GoianoPackageManager = require('../src/packages/PackageManager');

// ASCII Art do GSPack
const logo = `
 ██████╗ ███████╗██████╗  █████╗  ██████╗██╗  ██╗
██╔════╝ ██╔════╝██╔══██╗██╔══██╗██╔════╝██║ ██╔╝
██║  ███╗███████╗██████╔╝███████║██║     █████╔╝ 
██║   ██║╚════██║██╔═══╝ ██╔══██║██║     ██╔═██╗ 
╚██████╔╝███████║██║     ██║  ██║╚██████╗██║  ██╗
 ╚═════╝ ╚══════╝╚═╝     ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
                                                   
🇧🇷 GoiásScript Package Manager v2.0 - Packages 100% Goianos!
`;

class GSPackCLI {
  constructor() {
    this.packageManager = new GoianoPackageManager();
  }

  async install(packageName, options) {
    try {
      await this.packageManager.install(packageName, options.version);
    } catch (error) {
      process.exit(1);
    }
  }

  async uninstall(packageName) {
    try {
      await this.packageManager.uninstall(packageName);
    } catch (error) {
      process.exit(1);
    }
  }

  async list() {
    try {
      await this.packageManager.list();
    } catch (error) {
      process.exit(1);
    }
  }

  async create(packageName) {
    try {
      await this.packageManager.create(packageName);
    } catch (error) {
      process.exit(1);
    }
  }

  async publish(options) {
    try {
      await this.packageManager.publish(options.path);
    } catch (error) {
      process.exit(1);
    }
  }

  info() {
    console.log(logo);
    console.log('GSPack - Gerenciador de Packages GoiásScript');
    console.log('Versão: 2.0.0');
    console.log('Registry: registry.goiasscript.com (futuro)');
    console.log();
    console.log('📦 Packages built-in disponíveis:');
    console.log('  • goiano-utils - Utilitários essenciais');
    console.log('  • goiano-http - Cliente HTTP');  
    console.log('  • goiano-db - Banco de dados');
    console.log();
  }
}

// Configuração do CLI
const cli = new GSPackCLI();

program
  .name('gspack')
  .description('🇧🇷 GoiásScript Package Manager - Packages 100% Goianos!')
  .version('2.0.0');

// Comando: install
program
  .command('install')
  .alias('i')
  .description('Instala um package goiano')
  .argument('<package>', 'Nome do package para instalar')
  .option('-v, --version <version>', 'Versão específica', 'latest')
  .action(async (packageName, options) => {
    await cli.install(packageName, options);
  });

// Comando: uninstall  
program
  .command('uninstall')
  .alias('remove')
  .alias('rm')
  .description('Remove um package goiano')
  .argument('<package>', 'Nome do package para remover')
  .action(async (packageName) => {
    await cli.uninstall(packageName);
  });

// Comando: list
program
  .command('list')
  .alias('ls')
  .description('Lista packages instalados')
  .action(async () => {
    await cli.list();
  });

// Comando: create
program
  .command('create')
  .description('Cria um novo package goiano')
  .argument('<name>', 'Nome do package')
  .action(async (packageName) => {
    await cli.create(packageName);
  });

// Comando: publish
program
  .command('publish')
  .description('Publica package no registry')
  .option('-p, --path <path>', 'Caminho do package', process.cwd())
  .action(async (options) => {
    await cli.publish(options);
  });

// Comando: info
program
  .command('info')
  .description('Mostra informações sobre GSPack')
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