#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');

const GoiasScriptCompiler = require('../compiler');
const packageJson = require('../../package.json');

/**
 * CLI principal do GoiásScript
 * Implementa Command Pattern para diferentes comandos
 */
class GoiasScriptCLI {
  constructor() {
    this.program = new Command();
    this.compiler = new GoiasScriptCompiler();
    this.setupCommands();
  }

  /**
   * Configura todos os comandos disponíveis
   */
  setupCommands() {
    this.program
      .name('goiasscript')
      .description('Linguagem de programação baseada no dialeto goiano')
      .version(packageJson.version);

    // Comando principal: executar arquivo
    this.program
      .argument('[arquivo]', 'arquivo .gs para executar')
      .option('-c, --compiled', 'mostrar código JavaScript gerado')
      .option('-o, --output <arquivo>', 'salvar JavaScript em arquivo')
      .option('-w, --watch', 'observar arquivo e recompilar automaticamente')
      .option('-d, --debug', 'modo debug com informações extras')
      .option('--source-map', 'gerar source map')
      .action((arquivo, options) => {
        this.runFile(arquivo, options);
      });

    // Comando init
    this.program
      .command('init')
      .description('Inicializar projeto GoiásScript')
      .option('-n, --name <nome>', 'nome do projeto')
      .action((options) => {
        this.initProject(options);
      });

    // Comando validate
    this.program
      .command('validate <arquivo>')
      .description('Validar sintaxe de arquivo GoiásScript')
      .action((arquivo) => {
        this.validateFile(arquivo);
      });

    // Comando transpile
    this.program
      .command('transpile <arquivo>')
      .description('Transpilar arquivo para JavaScript')
      .option('-o, --output <arquivo>', 'arquivo de saída')
      .option('--source-map', 'gerar source map')
      .action((arquivo, options) => {
        this.transpileFile(arquivo, options);
      });

    // Comando docs
    this.program
      .command('docs')
      .description('Abrir documentação no navegador')
      .action(() => {
        this.openDocs();
      });
  }

  /**
   * Executa arquivo GoiásScript
   * @param {string} arquivo - Caminho do arquivo
   * @param {Object} options - Opções do comando
   */
  async runFile(arquivo, options = {}) {
    if (!arquivo) {
      console.log(chalk.yellow('Uso: goiasscript <arquivo.gs>'));
      console.log(chalk.blue('\\nExemplos:'));
      console.log('  goiasscript exemplo.gs');
      console.log('  goiasscript --compiled exemplo.gs');
      return;
    }

    try {
      const caminhoCompleto = path.resolve(arquivo);
      
      if (!await fs.pathExists(caminhoCompleto)) {
        console.error(chalk.red(`Arquivo não encontrado: ${arquivo}`));
        return;
      }

      if (!arquivo.endsWith('.gs')) {
        console.error(chalk.red('Arquivo deve ter extensão .gs'));
        return;
      }

      const codigo = await fs.readFile(caminhoCompleto, 'utf8');
      
      // Configurar compilador
      this.compiler = new GoiasScriptCompiler({
        debug: options.debug,
        sourceMap: options.sourceMap,
      });

      if (options.compiled) {
        // Apenas transpila e mostra o resultado
        const resultado = this.compiler.compile(codigo, arquivo);
        
        if (resultado.success) {
          console.log(chalk.green('📄 Código JavaScript gerado:'));
          console.log(chalk.dim('─'.repeat(50)));
          console.log(resultado.javascript);
          console.log(chalk.dim('─'.repeat(50)));
          
          if (options.output) {
            await fs.writeFile(options.output, resultado.javascript);
            console.log(chalk.green(`✅ Salvo em: ${options.output}`));
          }
        } else {
          resultado.error.mostrarErro();
        }
      } else {
        // Executa o código
        console.log(chalk.blue(`🤠 Executando: ${arquivo}`));
        console.log(chalk.dim('─'.repeat(30)));
        
        await this.compiler.execute(codigo, arquivo);
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro:'), error.message);
    }
  }

  /**
   * Inicializa projeto GoiásScript
   * @param {Object} options - Opções do comando
   */
  async initProject(options = {}) {
    const nome = options.name || 'meu-projeto-goiasscript';
    const diretorio = path.resolve(nome);

    try {
      // Criar estrutura de projeto
      await fs.ensureDir(diretorio);
      await fs.ensureDir(path.join(diretorio, 'src'));
      await fs.ensureDir(path.join(diretorio, 'exemplos'));

      // Criar package.json
      const packageJson = {
        name: nome,
        version: '1.0.0',
        description: 'Projeto em GoiásScript',
        main: 'src/main.gs',
        scripts: {
          start: 'goiasscript src/main.gs',
          dev: 'goiasscript --watch src/main.gs',
          build: 'goiasscript --compiled src/main.gs -o dist/main.js',
        },
        keywords: ['goiasscript'],
        author: '',
        license: 'MIT',
      };

      await fs.writeJson(path.join(diretorio, 'package.json'), packageJson, { spaces: 2 });

      // Criar arquivo principal
      const codigoMain = `// Meu primeiro projeto em GoiásScript!

uai saudacao é "Bão demais da conta, sô!";
prosa(saudacao);

presta_serviço exemploFuncao() {
  uai mensagem é "GoiásScript tá funcionando perfeitamente!";
  faz_favor mensagem;
}

prosa(exemploFuncao());
`;

      await fs.writeFile(path.join(diretorio, 'src', 'main.gs'), codigoMain);

      // Criar README
      const readme = `# ${nome}

Projeto criado com GoiásScript 🤠

## Como usar

\`\`\`bash
# Executar projeto
npm start

# Modo desenvolvimento
npm run dev

# Build para JavaScript
npm run build
\`\`\`

## Documentação

Visite a [documentação oficial](https://github.com/Gefferson-Souza/goiasscript) para aprender mais sobre GoiásScript.
`;

      await fs.writeFile(path.join(diretorio, 'README.md'), readme);

      console.log(chalk.green('🎉 Projeto criado com sucesso!'));
      console.log(chalk.blue(`📁 Diretório: ${diretorio}`));
      console.log(chalk.yellow('\\n📋 Próximos passos:'));
      console.log(`   cd ${nome}`);
      console.log('   npm start');

    } catch (error) {
      console.error(chalk.red('❌ Erro ao criar projeto:'), error.message);
    }
  }

  /**
   * Valida sintaxe de arquivo
   * @param {string} arquivo - Caminho do arquivo
   */
  async validateFile(arquivo) {
    try {
      const caminhoCompleto = path.resolve(arquivo);
      
      if (!await fs.pathExists(caminhoCompleto)) {
        console.error(chalk.red(`Arquivo não encontrado: ${arquivo}`));
        return;
      }

      const codigo = await fs.readFile(caminhoCompleto, 'utf8');
      const resultado = this.compiler.validate(codigo);

      if (resultado.valid) {
        console.log(chalk.green('✅ Sintaxe válida!'));
        console.log(chalk.blue(`📊 ${resultado.tokens.length} tokens encontrados`));
      } else {
        console.log(chalk.red('❌ Sintaxe inválida'));
        resultado.errors.forEach(erro => {
          if (erro.mostrarErro) {
            erro.mostrarErro();
          } else {
            console.error(chalk.red(erro.message));
          }
        });
      }

      if (resultado.warnings.length > 0) {
        console.log(chalk.yellow('⚠️  Avisos:'));
        resultado.warnings.forEach(warning => {
          console.log(chalk.yellow(`   ${warning}`));
        });
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro na validação:'), error.message);
    }
  }

  /**
   * Transpila arquivo para JavaScript
   * @param {string} arquivo - Caminho do arquivo
   * @param {Object} options - Opções do comando
   */
  async transpileFile(arquivo, options = {}) {
    try {
      const caminhoCompleto = path.resolve(arquivo);
      
      if (!await fs.pathExists(caminhoCompleto)) {
        console.error(chalk.red(`Arquivo não encontrado: ${arquivo}`));
        return;
      }

      const codigo = await fs.readFile(caminhoCompleto, 'utf8');
      
      this.compiler = new GoiasScriptCompiler({
        sourceMap: options.sourceMap,
      });
      
      const resultado = this.compiler.compile(codigo, arquivo);

      if (resultado.success) {
        const outputPath = options.output || arquivo.replace('.gs', '.js');
        
        await fs.writeFile(outputPath, resultado.javascript);
        
        if (resultado.sourceMap && options.sourceMap) {
          await fs.writeJson(outputPath + '.map', resultado.sourceMap);
        }

        console.log(chalk.green('✅ Transpilaçao concluída!'));
        console.log(chalk.blue(`📄 Arquivo: ${outputPath}`));
        console.log(chalk.dim(`📊 Estatísticas: ${resultado.stats.originalLines} → ${resultado.stats.compiledLines} linhas`));
      } else {
        resultado.error.mostrarErro();
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro na transpilação:'), error.message);
    }
  }

  /**
   * Abre documentação
   */
  openDocs() {
    const { exec } = require('child_process');
    const url = 'https://github.com/Gefferson-Souza/goiasscript#readme';
    
    console.log(chalk.blue('📚 Abrindo documentação...'));
    console.log(chalk.dim(`URL: ${url}`));
    
    // Tentar abrir no navegador padrão
    const command = process.platform === 'win32' ? 'start' : 
      process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    exec(`${command} ${url}`, (error) => {
      if (error) {
        console.log(chalk.yellow('Não foi possível abrir automaticamente.'));
        console.log(chalk.blue(`Acesse: ${url}`));
      }
    });
  }

  /**
   * Inicia o CLI
   */
  run() {
    // Tratamento de erros não capturados
    process.on('unhandledRejection', (error) => {
      console.error(chalk.red('❌ Erro não tratado:'), error.message);
      if (error.stack) {
        console.error(chalk.dim(error.stack));
      }
      process.exit(1);
    });

    this.program.parse();
  }
}

// Executar CLI se chamado diretamente
if (require.main === module) {
  const cli = new GoiasScriptCLI();
  cli.run();
}

module.exports = GoiasScriptCLI;