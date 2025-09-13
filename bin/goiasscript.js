#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { program } = require('commander');
const GoiasScriptCompiler = require('../src/compiler');

// ASCII Art do GoiásScript
const logo = `
 ██████╗  ██████╗ ██╗ █████╗ ███████╗    ███████╗ ██████╗██████╗ ██╗██████╗ ████████╗
██╔════╝ ██╔═══██╗██║██╔══██╗██╔════╝    ██╔════╝██╔════╝██╔══██╗██║██╔══██╗╚══██╔══╝
██║  ███╗██║   ██║██║███████║███████╗    ███████╗██║     ██████╔╝██║██████╔╝   ██║   
██║   ██║██║   ██║██║██╔══██║╚════██║    ╚════██║██║     ██╔══██╗██║██╔═══╝    ██║   
╚██████╔╝╚██████╔╝██║██║  ██║███████║    ███████║╚██████╗██║  ██║██║██║        ██║   
 ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═╝╚══════╝    ╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝        ╚═╝   
                                                                                      
🇧🇷 Linguagem de Programação Goiana v2.0 - Métodos 100% Goianos!
`;

class GoiasScriptCLI {
  constructor() {
    this.compiler = new GoiasScriptCompiler();
  }

  // Comando: compile
  async compile(filePath, options) {
    try {
      console.log('🔧 Compilando arquivo GoiásScript...\n');
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Erro: Arquivo '${filePath}' não encontrado!`);
        process.exit(1);
      }

      const code = fs.readFileSync(filePath, 'utf8');
      const result = this.compiler.compile(code, filePath);

      if (!result.success) {
        console.error('❌ Falha na compilação!\n');
        if (result.errors && result.errors.length > 0) {
          console.error('🚨 Erros:');
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

      console.log(`✅ Compilação concluída com sucesso!`);
      console.log(`📄 Arquivo gerado: ${outputPath}`);

      if (options.run) {
        console.log('\n🚀 Executando código compilado...\n');
        console.log('='.repeat(50));
        try {
          // Executar JavaScript gerado
          eval(result.javascript);
        } catch (execError) {
          console.error(`\n❌ Erro na execução: ${execError.message}`);
        }
        console.log('='.repeat(50));
      }

    } catch (error) {
      console.error(`❌ Erro inesperado: ${error.message}`);
      process.exit(1);
    }
  }

  // Comando: run
  async run(filePath) {
    await this.compile(filePath, { run: true, output: filePath.replace('.gs', '.temp.js') });
    
    // Limpar arquivo temporário
    const tempFile = filePath.replace('.gs', '.temp.js');
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
  }

  // Comando: check-types
  async checkTypes(filePath) {
    try {
      console.log('🔍 Verificando tipos GoiásScript...\n');
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ Erro: Arquivo '${filePath}' não encontrado!`);
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
        console.log('\n✅ Verificação de tipos concluída - nenhum problema encontrado!');
      }

    } catch (error) {
      console.error(`❌ Erro inesperado: ${error.message}`);
      process.exit(1);
    }
  }

  // Comando: new
  async newProject(projectName) {
    const projectPath = path.join(process.cwd(), projectName);
    
    try {
      if (fs.existsSync(projectPath)) {
        console.error(`❌ Projeto '${projectName}' já existe!`);
        process.exit(1);
      }

      console.log(`🚀 Criando novo projeto GoiásScript: ${projectName}\n`);

      // Criar estrutura do projeto
      fs.mkdirSync(projectPath);
      fs.mkdirSync(path.join(projectPath, 'src'));
      fs.mkdirSync(path.join(projectPath, 'docs'));

      // Arquivo principal
      const mainFile = `// ${projectName} - GoiásScript v2.0
// Arquivo principal do projeto

uai mensagem: texto é "Oi sô! Seu projeto GoiásScript tá funcionando!"
prosa(mensagem)

faz_trem saudar(nome: texto): texto {
  faz_favor "Oi " mais nome mais ", tudo beleza?"
}

faz_trem principal() {
  uai usuario: texto é "Desenvolvedor Goiano"
  uai saudacao: texto é saudar(usuario)
  prosa(saudacao)
  
  // Exemplo com lista
  uai tecnologias: lista é ["GoiásScript", "JavaScript", "Node.js"]
  prosa("Tecnologias usadas:")
  tecnologias.pra_cada(tech => prosa("• " mais tech))
  
  // Exemplo com math goiano
  uai numero_sorte: numero é GoianoMath.arredondar(GoianoMath.sorteio() vezes 100)
  prosa("Seu número da sorte é:", numero_sorte)
}

principal()
`;

      fs.writeFileSync(path.join(projectPath, 'src', 'main.gs'), mainFile);

      // Package.json do projeto
      const packageJson = {
        name: projectName,
        version: "1.0.0",
        description: `Projeto GoiásScript: ${projectName}`,
        main: "src/main.gs",
        scripts: {
          "start": "goiasscript run src/main.gs",
          "build": "goiasscript compile src/main.gs",
          "check": "goiasscript check-types src/main.gs"
        },
        keywords: ["goiasscript", "goias", "brasileiro"],
        author: "Desenvolvedor Goiano",
        license: "MIT",
        engines: {
          "goiasscript": "^2.0.0"
        }
      };

      fs.writeFileSync(
        path.join(projectPath, 'package.json'), 
        JSON.stringify(packageJson, null, 2)
      );

      // README.md
      const readme = `# ${projectName}

Projeto GoiásScript v2.0 com métodos 100% goianos!

## 🚀 Como usar

\`\`\`bash
# Executar projeto
npm start

# Compilar para JavaScript
npm run build

# Verificar tipos
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

      console.log(`✅ Projeto '${projectName}' criado com sucesso!`);
      console.log(`📁 Local: ${projectPath}`);
      console.log(`\n🎯 Próximos passos:`);
      console.log(`   cd ${projectName}`);
      console.log(`   goiasscript run src/main.gs`);

    } catch (error) {
      console.error(`❌ Erro ao criar projeto: ${error.message}`);
      process.exit(1);
    }
  }

  // Utilitário: ícones para tipos
  getTypeIcon(type) {
    const icons = {
      'TEXTO': '📝',
      'NUMERO': '🔢', 
      'BOOLEANO': '✅',
      'LISTA': '📋',
      'COISA': '📦',
      'FAZ_TREM': '⚡',
      'NADA': '🚫'
    };
    return icons[type] || '❓';
  }

  // Comando: version
  version() {
    console.log(logo);
    console.log('Versão: 2.0.0');
    console.log('Métodos: 100% Goianos');
    console.log('Autor: Gefferson Souza');
    console.log('');
  }
}

// Configuração do CLI
const cli = new GoiasScriptCLI();

program
  .name('goiasscript')
  .description('🇧🇷 CLI do GoiásScript - Linguagem de Programação Goiana v2.0')
  .version('2.0.0');

// Comando: compile
program
  .command('compile')
  .description('Compila arquivo GoiásScript para JavaScript')
  .argument('<file>', 'Arquivo .gs para compilar')
  .option('-o, --output <file>', 'Arquivo de saída')
  .option('-v, --verbose', 'Mostrar informações detalhadas')
  .option('-r, --run', 'Executar após compilar')
  .action(async (file, options) => {
    await cli.compile(file, options);
  });

// Comando: run  
program
  .command('run')
  .description('Compila e executa arquivo GoiásScript')
  .argument('<file>', 'Arquivo .gs para executar')
  .action(async (file) => {
    await cli.run(file);
  });

// Comando: check-types
program
  .command('check-types')
  .description('Verifica tipos em arquivo GoiásScript')
  .argument('<file>', 'Arquivo .gs para verificar')
  .action(async (file) => {
    await cli.checkTypes(file);
  });

// Comando: new
program
  .command('new')
  .description('Cria novo projeto GoiásScript')
  .argument('<name>', 'Nome do projeto')
  .action(async (name) => {
    await cli.newProject(name);
  });

// Comando: version personalizado
program
  .command('info')
  .description('Mostra informações sobre GoiásScript')
  .action(() => {
    cli.version();
  });

// Parse dos argumentos
program.parse();

// Se nenhum comando foi especificado, mostrar ajuda
if (!process.argv.slice(2).length) {
  console.log(logo);
  program.outputHelp();
}