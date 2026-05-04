#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const GoiasScriptCompiler = require('../src/compiler');
const pkg = require('../package.json');

// ASCII Art do GoiásScript
const logo = `
 ██████╗  ██████╗ ██╗ █████╗ ███████╗    ███████╗ ██████╗██████╗ ██╗██████╗ ████████╗
██╔════╝ ██╔═══██╗██║██╔══██╗██╔════╝    ██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝
██║  ███╗██║   ██║██║███████║███████╗    ███████╗██║     ██████╔╝██║██████╔╝   ██║   
██║   ██║██║   ██║██║██╔══██║╚════██║    ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   
╚██████╔╝╚██████╔╝██║██║  ██║███████║    ███████║╚██████╗██║  ██║██║██║        ██║   
 ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝    ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   
                                                                                      
🇧🇷 Linguagem de Programação Goiana v${pkg.version} — Goianês na Web
`;

class GoiasScriptCLI {
  constructor() {
    this.compiler = new GoiasScriptCompiler();
  }

  // Comando: traduz (compile)
  async traduz(filePath, options) {
    try {
      console.log('🔧 Traduzindo arquivo GoiásScript...\n');

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Ô rapaz! Arquivo '${filePath}' não foi achado não!`);
        process.exit(1);
      }

      const code = fs.readFileSync(filePath, 'utf8');
      const result = this.compiler.compile(code, filePath);

      if (!result.success) {
        console.error('❌ Ô rapaz! Deu ruim na tradução!\n');
        if (result.errors && result.errors.length > 0) {
          console.error('🚨 Erros encontrados:');
          result.errors.forEach(error => console.error(`  • ${error.message}`));
        }
        process.exit(1);
      }

      // Mostrar warnings
      if (result.warnings && result.warnings.length > 0) {
        console.warn('⚠️  Warnings:');
        result.warnings.forEach(warning => {
          console.warn(`  • ${warning.message}`);
          if (warning.suggestion) {
            console.warn(`    💡 ${warning.suggestion}`);
          }
        });
        console.log();
      }

      // Mostrar informações de compilação
      if (options.verbose) {
        console.log('📊 Informações de Compilação:');
        console.log(`  • Tipos analisados: ${result.typeInfo?.typeCount || 0}`);
        console.log(`  • Módulos: ${result.moduleInfo?.hasModules ? 'Sim' : 'Não'}`);
        if (result.moduleInfo?.imports?.length > 0) {
          console.log(`  • Imports: ${result.moduleInfo.imports.length}`);
        }
        if (result.moduleInfo?.exports?.length > 0) {
          console.log(`  • Exports: ${result.moduleInfo.exports.length}`);
        }
        console.log();
      }

      // Salvar arquivo JavaScript
      const outputPath = options.output || filePath.replace('.gs', '.js');
      fs.writeFileSync(outputPath, result.javascript, 'utf8');

      console.log(`✅ Tradução concluída com sucesso!`);
      console.log(`📄 Arquivo gerado: ${outputPath}`);

      if (options.run) {
        console.log('\n🚀 Executando código compilado...\n');
        console.log('='.repeat(50));
        try {
          // Executar JavaScript gerado
          eval(result.javascript);
        } catch (execError) {
          console.error(`\n❌ Ô rapaz! Deu ruim na execução: ${execError.message}`);
        }
        console.log('='.repeat(50));
      }
    } catch (error) {
      console.error(`❌ Ô rapaz! Deu ruim aqui: ${error.message}`);
      process.exit(1);
    }
  }

  // Comando: bota_pra_moer (run)
  async bota_pra_moer(filePath) {
    console.log('🚀 Botando o código pra moer...\n');
    console.log('='.repeat(50));
    await this.traduz(filePath, { run: true, output: filePath.replace('.gs', '.temp.js') });

    // Limpar arquivo temporário
    const tempFile = filePath.replace('.gs', '.temp.js');
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    console.log('='.repeat(50));
  }

  // Comando: vê_se_tá_certo (check-types)
  async vê_se_tá_certo(filePath) {
    try {
      console.log('🔍 Vendo se o trem tá certo...\n');

      if (!fs.existsSync(filePath)) {
        console.error(`❌ Ô rapaz! Arquivo '${filePath}' não foi achado não!`);
        process.exit(1);
      }

      const code = fs.readFileSync(filePath, 'utf8');
      const result = this.compiler.compile(code, filePath);

      if (result.typeInfo) {
        console.log('📊 Análise de Tipos:');
        console.log(`  • Símbolos analisados: ${result.typeInfo.typeCount}`);

        if (result.typeInfo.symbols && Object.keys(result.typeInfo.symbols).length > 0) {
          console.log('\n📋 Tabela de Símbolos:');
          Object.entries(result.typeInfo.symbols).forEach(([name, info]) => {
            const typeIcon = this.getTypeIcon(info.type);
            console.log(`  ${typeIcon} ${name}: ${info.type} (${info.declarationType})`);
          });
        }
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log('\n⚠️  Warnings de Tipos:');
        result.warnings.forEach(warning => {
          console.warn(`  • ${warning.message}`);
          if (warning.suggestion) {
            console.warn(`    💡 ${warning.suggestion}`);
          }
        });
      }

      if (result.errors && result.errors.length > 0) {
        console.log('\n🚨 Erros de Tipos:');
        result.errors.forEach(error => console.error(`  • ${error.message}`));
        process.exit(1);
      } else {
        console.log('\n✅ Tá tudo certo, sô! Nenhum problema encontrado!');
      }
    } catch (error) {
      console.error(`❌ Ô rapaz! Deu ruim aqui: ${error.message}`);
      process.exit(1);
    }
  }

  // Comando: arma_o_barraco (new)
  async arma_o_barraco(projectName, options = {}) {
    const template = options.template || 'basic';
    // path.resolve respeita caminho absoluto (/tmp/x) e relativo (meu-app);
    // path.join sempre prefixa cwd, quebra quando o user passa /tmp/...
    const projectPath = path.resolve(process.cwd(), projectName);

    try {
      if (fs.existsSync(projectPath)) {
        console.error(`❌ Ô rapaz! Já tem um projeto '${projectName}' aqui!`);
        process.exit(1);
      }

      console.log(`🚀 Armando o barraco do projeto: ${projectName} (template: ${template})\n`);

      // Criar estrutura do projeto
      fs.mkdirSync(projectPath);
      fs.mkdirSync(path.join(projectPath, 'src'));
      fs.mkdirSync(path.join(projectPath, 'docs'));

      // Estrutura adicional para templates
      if (template === 'web') {
        fs.mkdirSync(path.join(projectPath, 'public'));
      } else if (template === 'framework') {
        // Estrutura completa do framework
        fs.mkdirSync(path.join(projectPath, 'public'));
        fs.mkdirSync(path.join(projectPath, 'dist'));
        fs.mkdirSync(path.join(projectPath, 'scripts'));
        fs.mkdirSync(path.join(projectPath, 'src', 'components'), { recursive: true });
        fs.mkdirSync(path.join(projectPath, 'src', 'controllers'), { recursive: true });
        fs.mkdirSync(path.join(projectPath, 'src', 'services'), { recursive: true });
        fs.mkdirSync(path.join(projectPath, 'src', 'models'), { recursive: true });
        fs.mkdirSync(path.join(projectPath, 'src', 'config'), { recursive: true });
      }

      // Arquivo principal
      let mainFile;

      if (template === 'web') {
        // Usar template web externo
        const templatesPath = path.join(__dirname, '..', 'templates');
        const webTemplatePath = path.join(templatesPath, 'web-app.gs');

        if (fs.existsSync(webTemplatePath)) {
          mainFile = fs.readFileSync(webTemplatePath, 'utf-8');
          mainFile = mainFile.replace(/{{PROJECT_NAME}}/g, projectName);
        } else {
          // Fallback se não encontrar o template
          mainFile = `// ${projectName} - Aplicação Web GoiásScript v2.0
prosa("🚀 Carregando ${projectName}...");

trem appConfig é {
  nome: "${projectName}",
  versao: "1.0.0",
  tipo: "Aplicação Web GoiásScript"
};

prosta_serviço iniciarApp() {
  prosa("🎉 " mais appConfig.nome mais " iniciado!");
  prosa("📦 Versão: " mais appConfig.versao);
  prosa("⚡ Powered by GoiásScript v2.0");
}`;
        }
      } else {
        // Template básico
        mainFile = `// ${projectName} - GoiásScript v2.0
// Arquivo principal do projeto

prosa("=== Projeto ${projectName} ===");

trem mensagem é "Oi sô! Seu projeto GoiásScript tá funcionando!";
prosa(mensagem);

trem nome_projeto é "${projectName}";
prosa("Nome do projeto: " mais nome_projeto);

trem tecnologias é ["GoiásScript", "JavaScript", "Node.js"];
prosa("Tecnologias usadas:");

vai_indo (trem i é 0; i menor_que tecnologias.tamanho(); i = i mais 1) {
  prosa("• " mais tecnologias[i]);
}

trem numero_sorte = Math.floor(Math.random() * 100);
prosa("Número da sorte: " mais numero_sorte);

prosa("🎉 Projeto criado com sucesso!");
prosa("💡 Use: goiasscript vê_se_tá_certo para verificar tipos");
prosa("💡 Use: goiasscript traduz para gerar JavaScript");`;
      }

      const fileName = template === 'web' ? 'app.gs' : 'main.gs';
      fs.writeFileSync(path.join(projectPath, 'src', fileName), mainFile);

      // Arquivos específicos dos templates
      if (template === 'framework') {
        // Copiar todos os arquivos do template framework
        const templatesPath = path.join(__dirname, '..', 'templates');
        const frameworkTemplatePath = path.join(templatesPath, 'goias-web-framework');

        if (fs.existsSync(frameworkTemplatePath)) {
          this.copyTemplateDirectory(frameworkTemplatePath, projectPath, projectName);
        } else {
          console.log('⚠️  Template framework não encontrado, usando fallback...');
          // Criar arquivos básicos do framework
          this.createFrameworkFiles(projectPath, projectName);
        }
      } else if (template === 'web') {
        // Usar templates externos
        const templatesPath = path.join(__dirname, '..', 'templates');

        // Copiar template HTML
        const htmlTemplatePath = path.join(templatesPath, 'web-index.html');
        if (fs.existsSync(htmlTemplatePath)) {
          let htmlContent = fs.readFileSync(htmlTemplatePath, 'utf-8');
          htmlContent = htmlContent.replace(/{{PROJECT_NAME}}/g, projectName);
          fs.writeFileSync(path.join(projectPath, 'public', 'index.html'), htmlContent);
        }

        // Copiar servidor de desenvolvimento
        const devServerPath = path.join(templatesPath, 'dev-server.js');
        if (fs.existsSync(devServerPath)) {
          fs.mkdirSync(path.join(projectPath, 'scripts'), { recursive: true });
          fs.copyFileSync(devServerPath, path.join(projectPath, 'scripts', 'dev-server.js'));
        }

        // Copiar package.json específico para web
        const webPackagePath = path.join(templatesPath, 'web-package.json');
        if (fs.existsSync(webPackagePath)) {
          let packageContent = fs.readFileSync(webPackagePath, 'utf-8');
          packageContent = packageContent.replace(/{{PROJECT_NAME}}/g, projectName);
          packageContent = packageContent.replace(
            /{{PROJECT_DESCRIPTION}}/g,
            `Aplicação Web GoiásScript: ${projectName}`
          );
          packageContent = packageContent.replace(/{{AUTHOR_NAME}}/g, 'Desenvolvedor Goiano');
          fs.writeFileSync(path.join(projectPath, 'package.json'), packageContent);
        }
      }

      // Package.json do projeto (apenas para template básico)
      if (template !== 'web' && template !== 'framework') {
        const packageJson = {
          name: projectName,
          version: '1.0.0',
          description: `Projeto GoiásScript: ${projectName}`,
          main: 'src/main.gs',
          scripts: {
            start: 'goiasscript bota_pra_moer src/main.gs',
            build: 'goiasscript traduz src/main.gs',
            check: 'goiasscript vê_se_tá_certo src/main.gs',
          },
          keywords: ['goiasscript', 'goias', 'brasileiro'],
          author: 'Desenvolvedor Goiano',
          license: 'MIT',
          engines: {
            goiasscript: '^2.0.0',
          },
        };

        fs.writeFileSync(
          path.join(projectPath, 'package.json'),
          JSON.stringify(packageJson, null, 2)
        );
      }

      // README.md
      const readme = `# ${projectName}

Projeto GoiásScript v2.0 com métodos 100% goianos!

## 🚀 Como usar

\`\`\`bash
# Executar projeto
npm start

# Traduzir para JavaScript  
npm run build

# Verificar se tá tudo certo
npm run check
\`\`\`

## 📁 Estrutura

\`\`\`
${projectName}/
├── src/
│   └── main.gs          # Arquivo principal
├── docs/               # Documentação
├── package.json        # Configurações do projeto
└── README.md          # Este arquivo
\`\`\`

## 🇧🇷 Sobre GoiásScript

GoiásScript é uma linguagem de programação goiana que usa métodos 100% nativos em português brasileiro, sem depender de JavaScript.

### Exemplos de métodos goianos:

\`\`\`goiasscript
// Texto
nome.pra_maiusculo()     // vs nome.toUpperCase()
nome.dividir(" ")        // vs nome.split(" ")

// Lista  
numeros.mapear(x => x)   // vs numeros.map(x => x)
numeros.filtrar(x => x)  // vs numeros.filter(x => x)

// Math
GoianoMath.sorteio()     // vs Math.random()
\`\`\`

*Desenvolvido com ❤️ em Goiás!*
`;

      fs.writeFileSync(path.join(projectPath, 'README.md'), readme);

      // Instalar dependências automaticamente para projetos web e framework
      if (template === 'web' || template === 'framework') {
        console.log(`📦 Instalando dependências...`);
        const { spawn } = require('child_process');

        const npmInstall = spawn('npm', ['install'], {
          cwd: projectPath,
          stdio: 'inherit',
        });

        npmInstall.on('close', code => {
          if (code === 0) {
            console.log(`\n✅ Barraco armado com sucesso!`);
            console.log(`📁 Local: ${projectPath}`);
            console.log(`\n🎯 Próximos passos:`);
            console.log(`   cd ${projectName}`);
            if (template === 'framework') {
              console.log(`   npm run dev                    # Servidor com hot reload 🔥`);
              console.log(`   # ou:`);
              console.log(`   npm run build                 # Build para produção`);
              console.log(`   npm start                     # Build + servir`);
              console.log(`\n🚀 Recursos do Framework:`);
              console.log(`   • Hot Reload com WebSocket`);
              console.log(`   • TailwindCSS com tema goiano`);
              console.log(`   • Arquitetura modular (NestJS style)`);
              console.log(`   • Full-Stack em GoiásScript`);
            } else {
              console.log(
                `   npm run dev                    # Iniciar servidor de desenvolvimento`
              );
              console.log(`   # ou:`);
              console.log(`   goiasscript bota_pra_moer src/app.gs`);
            }
          } else {
            console.log(`\n⚠️  Barraco criado, mas deu problema na instalação das dependências.`);
            console.log(`📁 Local: ${projectPath}`);
            console.log(`\n🎯 Execute manualmente:`);
            console.log(`   cd ${projectName}`);
            console.log(`   npm install`);
            console.log(`   npm run dev`);
          }
        });
      } else {
        console.log(`✅ Barraco armado com sucesso!`);
        console.log(`📁 Local: ${projectPath}`);
        console.log(`\n🎯 Próximos passos:`);
        console.log(`   cd ${projectName}`);
        console.log(`   goiasscript bota_pra_moer src/main.gs`);
      }
    } catch (error) {
      console.error(`❌ Ô rapaz! Deu ruim ao armar o barraco: ${error.message}`);
      process.exit(1);
    }
  }

  // Função para copiar diretório de template recursivamente
  copyTemplateDirectory(src, dest, projectName) {
    const files = fs.readdirSync(src);

    files.forEach(file => {
      const srcPath = path.join(src, file);
      const destPath = path.join(dest, file);
      const stat = fs.statSync(srcPath);

      if (stat.isDirectory()) {
        // Criar diretório e copiar recursivamente
        fs.mkdirSync(destPath, { recursive: true });
        this.copyTemplateDirectory(srcPath, destPath, projectName);
      } else {
        // Copiar arquivo e substituir variáveis
        let content = fs.readFileSync(srcPath, 'utf-8');

        // Substituir variáveis do template
        content = content.replace(/{{projectName}}/g, projectName);
        content = content.replace(/{{PROJECT_NAME}}/g, projectName);
        content = content.replace(/{{projeto_nome}}/g, projectName);
        content = content.replace(/{{data_criacao}}/g, new Date().toISOString().split('T')[0]);
        content = content.replace(/{{autor_nome}}/g, 'Desenvolvedor Goiano');

        fs.writeFileSync(destPath, content);
      }
    });
  }

  // Função para criar arquivos básicos do framework (fallback)
  createFrameworkFiles(projectPath, projectName) {
    console.log('🏗️ Criando estrutura básica do framework...');

    // package.json personalizado para framework
    const frameworkPackageJson = {
      name: projectName,
      version: '1.0.0',
      description: `GoiásScript Framework - ${projectName}`,
      main: 'src/main.gs',
      type: 'module',
      scripts: {
        dev: 'node scripts/dev-server.js',
        build: 'node scripts/build.js',
        serve: 'node scripts/serve.js',
        start: 'npm run build && npm run serve',
        check: 'goiasscript vê_se_tá_certo src/**/*.gs',
      },
      keywords: ['goiasscript', 'framework', 'web', 'goias', 'brasileiro'],
      author: 'Desenvolvedor Goiano',
      license: 'MIT',
      engines: {
        node: '>=16.0.0',
      },
      devDependencies: {
        chokidar: '^3.5.3',
        ws: '^8.16.0',
        'node-static': '^0.7.11',
        tailwindcss: '^3.4.0',
      },
    };

    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(frameworkPackageJson, null, 2)
    );

    // Criar arquivo principal básico
    const mainContent = `// ${projectName} - GoiásScript Framework
pega "./app.module" em { AppModule }

// Inicializar aplicação
faz_trem iniciarApp() {
  prosa("🚀 ${projectName} iniciado com sucesso!")
  prosa("📦 GoiásScript Framework v2.0")
}

iniciarApp()
`;

    fs.writeFileSync(path.join(projectPath, 'src', 'main.gs'), mainContent);

    console.log('✅ Estrutura básica criada!');
  }

  // Utilitário: ícones para tipos
  getTypeIcon(type) {
    const icons = {
      TEXTO: '📝',
      NUMERO: '🔢',
      BOOLEANO: '✅',
      LISTA: '📋',
      COISA: '📦',
      FAZ_TREM: '⚡',
      NADA: '🚫',
    };
    return icons[type] || '❓';
  }

  // Comando: dedo_de_prosa (info)
  dedo_de_prosa() {
    console.log(logo);
    console.log(`Versão: ${pkg.version}`);
    console.log('Métodos: 100% Goianos');
    console.log('Autor: Gefferson Souza');
    console.log('');
  }
}

// Configuração do CLI
const cli = new GoiasScriptCLI();

program
  .name('goiasscript')
  .description('🇧🇷 CLI do GoiásScript — Linguagem de Programação Goiana')
  .version(pkg.version);

// Comando: traduz (compile)
program
  .command('traduz')
  .description('Traduz arquivo GoiásScript para JavaScript')
  .argument('<file>', 'Arquivo .gs para traduzir')
  .option('-o, --output <file>', 'Arquivo de saída')
  .option('-v, --verbose', 'Mostrar informações detalhadas')
  .option('-r, --run', 'Executar após traduzir')
  .action(async (file, options) => {
    await cli.traduz(file, options);
  });

// Comando: compile (alias para traduz - compatibilidade)
program
  .command('compile')
  .description('Traduz arquivo GoiásScript para JavaScript (alias para traduz)')
  .argument('<file>', 'Arquivo .gs para traduzir')
  .option('-o, --output <file>', 'Arquivo de saída')
  .option('-v, --verbose', 'Mostrar informações detalhadas')
  .option('-r, --run', 'Executar após traduzir')
  .action(async (file, options) => {
    await cli.traduz(file, options);
  });

// Comando: bota_pra_moer (run)
program
  .command('bota_pra_moer')
  .description('Bota o código GoiásScript pra moer (traduz e executa)')
  .argument('<file>', 'Arquivo .gs para executar')
  .action(async file => {
    await cli.bota_pra_moer(file);
  });

// Comando: run (alias para bota_pra_moer - compatibilidade)
program
  .command('run')
  .description('Bota o código GoiásScript pra moer (alias para bota_pra_moer)')
  .argument('<file>', 'Arquivo .gs para executar')
  .action(async file => {
    await cli.bota_pra_moer(file);
  });

// Comando: vê_se_tá_certo (check-types)
program
  .command('vê_se_tá_certo')
  .description('Vê se o trem tá certo (verifica tipos)')
  .argument('<file>', 'Arquivo .gs para verificar')
  .action(async file => {
    await cli.vê_se_tá_certo(file);
  });

// Comando: check-types (alias para vê_se_tá_certo - compatibilidade)
program
  .command('check-types')
  .description('Vê se o trem tá certo (alias para vê_se_tá_certo)')
  .argument('<file>', 'Arquivo .gs para verificar')
  .action(async file => {
    await cli.vê_se_tá_certo(file);
  });

// Comando: arma_o_barraco (new)
program
  .command('arma_o_barraco')
  .description('Arma o barraco de um novo projeto GoiásScript')
  .argument('<name>', 'Nome do projeto')
  .option('-t, --template <type>', 'Tipo de template (basic, web, framework)', 'basic')
  .action(async (name, options) => {
    await cli.arma_o_barraco(name, options);
  });

// Comando: new (alias para arma_o_barraco - compatibilidade)
program
  .command('new')
  .description('Arma o barraco de um novo projeto (alias para arma_o_barraco)')
  .argument('<name>', 'Nome do projeto')
  .option('-t, --template <type>', 'Tipo de template (basic, web, framework)', 'basic')
  .action(async (name, options) => {
    await cli.arma_o_barraco(name, options);
  });

// Comando: dedo_de_prosa (info)
program
  .command('dedo_de_prosa')
  .description('Dá um dedo de prosa sobre o GoiásScript')
  .action(() => {
    cli.dedo_de_prosa();
  });

// Comando: info (alias para dedo_de_prosa - compatibilidade)
program
  .command('info')
  .description('Dá um dedo de prosa sobre o GoiásScript (alias para dedo_de_prosa)')
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
