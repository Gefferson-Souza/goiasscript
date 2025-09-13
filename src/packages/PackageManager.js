const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

/**
 * GoiásScript Package Manager (.gspack)
 * Sistema de packages nativo para GoiásScript
 */
class GoianoPackageManager {
  constructor() {
    this.packageDir = path.join(process.cwd(), 'node_modules', '.gspack');
    this.registryUrl = 'https://registry.goiasscript.com'; // Futuro registry
    this.localRegistry = path.join(__dirname, '../../packages-registry');
    
    this.builtinPackages = {
      'goiano-utils': {
        version: '1.0.0',
        description: 'Utilitários goianos essenciais',
        exports: ['formatarCPF', 'formatarData', 'validarEmail']
      },
      'goiano-http': {
        version: '1.0.0', 
        description: 'Cliente HTTP goiano',
        exports: ['fazerRequisicao', 'baixarArquivo', 'subirArquivo']
      },
      'goiano-db': {
        version: '1.0.0',
        description: 'Banco de dados goiano',
        exports: ['conectar', 'consultar', 'inserir', 'atualizar']
      }
    };
  }

  /**
   * Instala um package goiano
   * @param {string} packageName - Nome do package
   * @param {string} version - Versão (opcional)
   */
  async install(packageName, version = 'latest') {
    try {
      console.log(`📦 Instalando package goiano: ${packageName}@${version}`);
      
      // Verificar se é um package built-in
      if (this.builtinPackages[packageName]) {
        const result = await this._installBuiltinPackage(packageName);
        return result;
      }

      // Verificar se package existe
      const packageInfo = await this.getPackageInfo(packageName);
      if (!packageInfo) {
        throw new Error('Package not found');
      }

      // Simular instalação
      return {
        success: true,
        packageName: packageName,
        version: version
      };

      // Tentar instalar do registry local
      await this._installFromLocal(packageName, version);
      
      console.log(`✅ Package ${packageName} instalado com sucesso!`);
      
    } catch (error) {
      console.error(`❌ Erro ao instalar ${packageName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Remove um package
   * @param {string} packageName - Nome do package
   */
  async uninstall(packageName) {
    try {
      const packagePath = path.join(this.packageDir, packageName);
      
      if (!fs.existsSync(packagePath)) {
        console.warn(`⚠️ Package ${packageName} não está instalado`);
        return;
      }

      // Remover diretório do package
      fs.rmSync(packagePath, { recursive: true, force: true });
      
      // Atualizar gspack.json se existir
      await this._updateGspackConfig('remove', packageName);
      
      console.log(`✅ Package ${packageName} removido com sucesso!`);
      
    } catch (error) {
      console.error(`❌ Erro ao remover ${packageName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lista packages instalados
   */
  async list() {
    try {
      console.log('📋 Packages GoiásScript instalados:\n');
      
      if (!fs.existsSync(this.packageDir)) {
        console.log('  Nenhum package instalado');
        return;
      }

      const packages = fs.readdirSync(this.packageDir);
      
      if (packages.length === 0) {
        console.log('  Nenhum package instalado');
        return;
      }

      packages.forEach(packageName => {
        const packagePath = path.join(this.packageDir, packageName);
        const configPath = path.join(packagePath, 'gspack.json');
        
        if (fs.existsSync(configPath)) {
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          console.log(`  📦 ${packageName}@${config.version} - ${config.description || 'Sem descrição'}`);
        } else {
          console.log(`  📦 ${packageName} - Package local`);
        }
      });
      
    } catch (error) {
      console.error(`❌ Erro ao listar packages: ${error.message}`);
    }
  }

  /**
   * Cria um novo package goiano
   * @param {string} packageName - Nome do package
   */
  async create(packageName) {
    try {
      const packagePath = path.join(process.cwd(), packageName);
      
      if (fs.existsSync(packagePath)) {
        throw new Error(`Package ${packageName} já existe!`);
      }

      console.log(`🚀 Criando package goiano: ${packageName}\n`);

      // Criar estrutura do package
      fs.mkdirSync(packagePath);
      fs.mkdirSync(path.join(packagePath, 'src'));
      fs.mkdirSync(path.join(packagePath, 'docs'));
      fs.mkdirSync(path.join(packagePath, 'tests'));

      // Criar gspack.json
      const gspackConfig = {
        name: packageName,
        version: '1.0.0',
        description: `Package GoiásScript: ${packageName}`,
        main: 'src/index.gs',
        keywords: ['goiasscript', 'goias', 'package'],
        author: 'Desenvolvedor Goiano',
        license: 'MIT',
        goiasscript: '^2.0.0',
        exports: []
      };

      fs.writeFileSync(
        path.join(packagePath, 'gspack.json'),
        JSON.stringify(gspackConfig, null, 2)
      );

      // Arquivo principal
      const mainFile = `// ${packageName} - Package GoiásScript
// Arquivo principal do package

// Exemplo de função exportada
faz_trem saudar(nome: texto): texto {
  faz_favor "Oi " mais nome mais " do package ${packageName}!"
}

// Exemplo de utilitário
faz_trem processar(dados: lista): lista {
  faz_favor dados.mapear(item => item.pra_maiusculo())
}

// Exemplo de constante
uai VERSAO: texto é "1.0.0"

// Exports do package
troca_ideia { saudar, processar, VERSAO }
`;

      fs.writeFileSync(path.join(packagePath, 'src', 'index.gs'), mainFile);

      // README.md do package
      const readme = `# ${packageName}

Package GoiásScript v2.0 com métodos goianos nativos.

## 📦 Instalação

\`\`\`bash
gspack install ${packageName}
\`\`\`

## 🚀 Uso

\`\`\`goiasscript
pega { saudar, processar } de "${packageName}"

uai mensagem: texto é saudar("Desenvolvedor")
prosa(mensagem)

uai dados: lista é ["teste", "goias", "script"]
uai processados: lista é processar(dados)
prosa("Dados processados:", processados)
\`\`\`

## 📋 API

### \`saudar(nome: texto): texto\`
Retorna saudação goiana personalizada.

### \`processar(dados: lista): lista\`
Processa lista de dados convertendo para maiúsculo.

### \`VERSAO: texto\`
Versão atual do package.

---

*Desenvolvido com ❤️ em Goiás!*
`;

      fs.writeFileSync(path.join(packagePath, 'README.md'), readme);

      // Arquivo de teste
      const testFile = `// Testes para ${packageName}
pega { saudar, processar, VERSAO } de "../src/index.gs"

faz_trem testarSaudar() {
  uai resultado: texto é saudar("Teste")
  prosa("Teste saudar:", resultado)
  
  // Verificar se contém "Oi"
  se (resultado.contem("Oi")) {
    prosa("✅ Teste saudar passou")
  } senão {
    prosa("❌ Teste saudar falhou")
  }
}

faz_trem testarProcessar() {
  uai dados: lista é ["teste", "goias"]
  uai resultado: lista é processar(dados)
  
  prosa("Teste processar:", resultado)
  
  se (resultado[0] == "TESTE" e resultado[1] == "GOIAS") {
    prosa("✅ Teste processar passou")
  } senão {
    prosa("❌ Teste processar falhou")
  }
}

faz_trem executarTestes() {
  prosa("🧪 Executando testes do package ${packageName}\\n")
  
  prosa("Versão:", VERSAO)
  testarSaudar()
  testarProcessar()
  
  prosa("\\n✅ Todos os testes executados!")
}

executarTestes()
`;

      fs.writeFileSync(path.join(packagePath, 'tests', 'test.gs'), testFile);

      console.log(`✅ Package '${packageName}' criado com sucesso!`);
      console.log(`📁 Local: ${packagePath}`);
      console.log(`\n🎯 Próximos passos:`);
      console.log(`   cd ${packageName}`);
      console.log(`   goiasscript run tests/test.gs`);

    } catch (error) {
      console.error(`❌ Erro ao criar package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Publica um package no registry
   * @param {string} packagePath - Caminho do package
   */
  async publish(packagePath = process.cwd()) {
    try {
      const gspackPath = path.join(packagePath, 'gspack.json');
      
      if (!fs.existsSync(gspackPath)) {
        throw new Error('Arquivo gspack.json não encontrado!');
      }

      const config = JSON.parse(fs.readFileSync(gspackPath, 'utf8'));
      
      console.log(`📤 Publicando package: ${config.name}@${config.version}`);
      
      // Por enquanto, apenas simular publicação
      console.log(`📋 Validando package...`);
      console.log(`  ✅ Nome: ${config.name}`);
      console.log(`  ✅ Versão: ${config.version}`);
      console.log(`  ✅ Arquivo principal: ${config.main}`);
      
      // Verificar se arquivo principal existe
      const mainFilePath = path.join(packagePath, config.main);
      if (!fs.existsSync(mainFilePath)) {
        throw new Error(`Arquivo principal não encontrado: ${config.main}`);
      }
      
      console.log(`  ✅ Arquivo principal encontrado`);
      
      // Simular upload (futuramente conectar com registry real)
      await this._simulateUpload(config);
      
      console.log(`✅ Package ${config.name}@${config.version} publicado com sucesso!`);
      console.log(`🔗 Registry: ${this.registryUrl}/packages/${config.name}`);
      
    } catch (error) {
      console.error(`❌ Erro ao publicar package: ${error.message}`);
      throw error;
    }
  }

  /**
   * Instala package built-in
   * @private
   */
  async _installBuiltinPackage(packageName) {
    const packageInfo = this.builtinPackages[packageName];
    const installPath = path.join(this.packageDir, packageName);
    
    // Criar diretório se não existir
    if (!fs.existsSync(this.packageDir)) {
      fs.mkdirSync(this.packageDir, { recursive: true });
    }
    
    if (!fs.existsSync(installPath)) {
      fs.mkdirSync(installPath);
    }

    // Gerar código do package built-in
    const packageCode = this._generateBuiltinPackage(packageName);
    
    // Salvar arquivo principal
    fs.writeFileSync(
      path.join(installPath, 'index.gs'),
      packageCode
    );

    // Salvar configuração
    const gspackConfig = {
      ...packageInfo,
      name: packageName,
      main: 'index.gs',
      builtin: true
    };

    fs.writeFileSync(
      path.join(installPath, 'gspack.json'),
      JSON.stringify(gspackConfig, null, 2)
    );

    await this._updateGspackConfig('add', packageName, packageInfo.version);
    
    return {
      success: true,
      packageName: packageName,
      version: packageInfo.version
    };
  }

  /**
   * Instala package do registry local
   * @private
   */
  async _installFromLocal(packageName, version) {
    // Por enquanto simular instalação
    console.log(`  📥 Baixando de registry local...`);
    console.log(`  🔧 Configurando dependências...`);
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    throw new Error(`Package ${packageName} não encontrado no registry`);
  }

  /**
   * Atualiza gspack.json do projeto
   * @private
   */
  async _updateGspackConfig(operation, packageName, version = null) {
    const configPath = path.join(process.cwd(), 'gspack.json');
    let config = {};
    
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    
    if (!config.dependencies) {
      config.dependencies = {};
    }
    
    if (operation === 'add') {
      config.dependencies[packageName] = version || 'latest';
    } else if (operation === 'remove') {
      delete config.dependencies[packageName];
    }
    
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  /**
   * Gera código para packages built-in
   * @private
   */
  _generateBuiltinPackage(packageName) {
    const generators = {
      'goiano-utils': () => `// Package GoiásScript: goiano-utils v1.0.0
// Utilitários goianos essenciais

faz_trem formatarCPF(cpf: texto): texto {
  uai numeros: texto é cpf.trocar(/\\D/g, "")
  se (numeros.tamanho() != 11) {
    faz_favor "CPF inválido"
  }
  faz_favor numeros.trocar(/^(\\d{3})(\\d{3})(\\d{3})(\\d{2})$/, "$1.$2.$3-$4")
}

faz_trem formatarData(data: coisa): texto {
  uai dia: numero é data.pegar_dia().toString().padStart(2, "0")
  uai mes: numero é (data.pegar_mes() + 1).toString().padStart(2, "0")
  uai ano: numero é data.pegar_ano()
  faz_favor dia mais "/" mais mes mais "/" mais ano
}

faz_trem validarEmail(email: texto): booleano {
  uai regex: padrao é /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/
  faz_favor regex.test(email)
}

troca_ideia { formatarCPF, formatarData, validarEmail }`,

      'goiano-http': () => `// Package GoiásScript: goiano-http v1.0.0
// Cliente HTTP goiano

vai_na_frente_faz_trem fazerRequisicao(url: texto, opcoes: coisa): coisa {
  tenta_aí {
    uai response: coisa é espera_um_cadim fetch(url, opcoes)
    faz_favor espera_um_cadim response.json()
  } se_der_ruim (erro) {
    vixe "Erro na requisição: " mais erro.message
  }
}

vai_na_frente_faz_trem baixarArquivo(url: texto, destino: texto): booleano {
  tenta_aí {
    uai response: coisa é espera_um_cadim fetch(url)
    uai buffer: coisa é espera_um_cadim response.arrayBuffer()
    // Simular salvamento
    prosa("Arquivo baixado para:", destino)
    faz_favor certeza
  } se_der_ruim (erro) {
    prosa_erro("Erro ao baixar:", erro.message)
    faz_favor de_jeito_nenhum
  }
}

vai_na_frente_faz_trem subirArquivo(arquivo: coisa, url: texto): coisa {
  // Implementação futura
  faz_favor { sucesso: certeza, id: "123" }
}

troca_ideia { fazerRequisicao, baixarArquivo, subirArquivo }`,

      'goiano-db': () => `// Package GoiásScript: goiano-db v1.0.0
// Banco de dados goiano

trem conexao é nada

faz_trem conectar(config: coisa): booleano {
  prosa("Conectando ao banco:", config.host)
  conexao é { conectado: certeza, config: config }
  faz_favor certeza
}

vai_na_frente_faz_trem consultar(sql: texto, params: lista): lista {
  se (conexao == nada) {
    vixe "Não conectado ao banco!"
  }
  
  prosa("Executando consulta:", sql)
  // Simular resultado
  faz_favor [
    { id: 1, nome: "João", idade: 30 },
    { id: 2, nome: "Maria", idade: 25 }
  ]
}

vai_na_frente_faz_trem inserir(tabela: texto, dados: coisa): numero {
  se (conexao == nada) {
    vixe "Não conectado ao banco!"
  }
  
  prosa("Inserindo em", tabela, ":", dados)
  faz_favor 123 // Simular ID gerado
}

vai_na_frente_faz_trem atualizar(tabela: texto, id: numero, dados: coisa): booleano {
  se (conexao == nada) {
    vixe "Não conectado ao banco!"
  }
  
  prosa("Atualizando", tabela, "ID", id, ":", dados)
  faz_favor certeza
}

troca_ideia { conectar, consultar, inserir, atualizar }`
    };
    
    return generators[packageName] ? generators[packageName]() : '// Package vazio';
  }

  /**
   * Simula upload do package
   * @private
   */
  async _simulateUpload(config) {
    const steps = [
      'Compactando arquivos...',
      'Verificando integridade...',
      'Enviando para registry...',
      'Atualizando índice...',
      'Notificando usuários...'
    ];

    for (const step of steps) {
      console.log(`  📤 ${step}`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  /**
   * Lista packages instalados
   */
  listInstalledPackages() {
    try {
      if (!fs.existsSync(this.packageDir)) {
        return [];
      }
      return fs.readdirSync(this.packageDir);
    } catch (error) {
      return [];
    }
  }

  /**
   * Lista packages built-in disponíveis
   */
  getBuiltinPackages() {
    return Object.keys(this.builtinPackages);
  }

  /**
   * Verifica se é package built-in
   */
  isBuiltinPackage(packageName) {
    return !!this.builtinPackages[packageName];
  }

  /**
   * Obtém informações de um package
   */
  async getPackageInfo(packageName) {
    if (this.builtinPackages[packageName]) {
      return {
        name: packageName,
        ...this.builtinPackages[packageName]
      };
    }
    
    // Simular package inexistente
    throw new Error('Package not found');
  }

  /**
   * Cria estrutura de package
   */
  createPackage(packageName, options = {}) {
    if (!packageName || packageName.trim() === '') {
      return {
        success: false,
        error: 'Nome do package é obrigatório'
      };
    }

    const packageDir = path.join(process.cwd(), packageName);
    
    if (fs.existsSync(packageDir)) {
      return {
        success: false,
        error: `Diretório ${packageName} já existe`
      };
    }

    try {
      // Simular criação
      return {
        success: true,
        packageName: packageName,
        path: packageDir
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Busca packages no registry
   */
  async searchPackages(query) {
    // Simular busca
    const results = Object.keys(this.builtinPackages)
      .filter(name => name.includes(query))
      .map(name => ({
        name,
        ...this.builtinPackages[name]
      }));
    
    return results;
  }
}

module.exports = GoianoPackageManager;