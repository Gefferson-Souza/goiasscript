#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * GoiásScript v2 - Compilador mais robusto para a linguagem goiana
 * @author Gefferson-Souza
 * @date 2025-04-13
 */

class GoiasScriptCompiler {
  constructor() {
    // Mapeamento de palavras-chave
    this.keywords = {
      // Declarações e atribuições
      'uai': 'const',
      'trem': 'var',
      'é': '=',
      'ocê': 'this',
      
      // Classes e objetos
      'arruma_trem': 'class',         // class
      'aprepara_trem': 'constructor', // constructor
      'inherda_de': 'extends',        // extends
      'é_tipo_de': 'instanceof',      // instanceof
      
      // Estruturas de controle
      'se_ocê_quiser': 'if',
      'se_num_for': 'else if',
      'se_não': 'else',
      'vai_indo': 'for',
      'enquanto_tiver': 'while',
      'para_com_isso': 'break',
      'continua_aí': 'continue',
      
      // Funções
      'presta_serviço': 'function',
      'faz_favor': 'return',
      'mexe_assim': 'method',         // Para destacar métodos de classe
      
      // Operadores lógicos
      'e_mais': '&&',
      'ou_então': '||',
      'num_é': '!',
      'é_igualim': '===',
      'diferente': '!==',
      'maior_que': '>',
      'menor_que': '<',
      'pelo_menos': '>=',
      'no_máximo': '<=',
      
      // Operações
      'mais': '+',
      'menos': '-',
      'vezes': '*',
      'dividido': '/',
      'sobrou': '%',
      
      // Estruturas de dados
      'lista': 'Array',
      'um_tanto_de': 'Object',
      'tem': ':',
      
      // Console e controle
      'prosa': 'console.log',
      'reclama': 'console.error',
      'vixe': 'throw new Error',
      
      // Tipos
      'vazio': 'null',
      'sei_lá': 'undefined',
      'certeza': 'true',
      'de_jeito_nenhum': 'false',
      
      // Loop specific
      'em': 'in',
      'de': 'of',
      
      // Async/await e Promises
      'vai_na_frente': 'async',
      'vai_na_frente_presta_serviço': 'async function',
      'espera_um_cadim': 'await',
      'promessa': 'Promise',
      'quando_resolver': 'then',
      'se_der_pobrema': 'catch',
      'por_fim': 'finally',
      'resolve_aí': 'resolve',
      'rejeita_isso': 'reject',
      
      // Try/Catch e new
      'tenta_aí': 'try',
      'se_der_ruim': 'catch',
      'faz_um': 'new',
      
      // Especificadores de acesso para classes
      'ninguem_fuça': 'private',      // private
      'só_da_famia': 'protected',     // protected
      'todo_mundo_vê': 'public',      // public
      'num_muda': 'static',           // static
      'fixo': 'final'                 // final (conceito similar)
    };
    
    // Padrões especiais que precisam ser pré-processados
    this.patterns = [
      { from: /vai_na_frente\s+presta_serviço/g, to: 'async function' },
      // Específicos para classes
      { from: /arruma_trem\s+([A-Za-z_][A-Za-z0-9_]*)\s+inherda_de\s+([A-Za-z_][A-Za-z0-9_]*)/g, to: 'class $1 extends $2' },
      { from: /arruma_trem\s+([A-Za-z_][A-Za-z0-9_]*)/g, to: 'class $1' },
      { from: /aprepara_trem\s*\(/g, to: 'constructor(' },
      { from: /mexe_assim\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, to: '$1(' },
      { from: /ninguem_fuça\s+/g, to: 'private ' },
      { from: /só_da_famia\s+/g, to: 'protected ' },
      { from: /todo_mundo_vê\s+/g, to: 'public ' },
      { from: /num_muda\s+/g, to: 'static ' },
      // Tratamento para 'ocê' (this)
      { from: /\bocê\b/g, to: 'this' },
      { from: /\bocê\./g, to: 'this.' }
    ];
  }

  compile(code) {
    // Pré-processamento para padrões específicos de classe
    for (const pattern of this.patterns) {
      code = code.replace(pattern.from, pattern.to);
    }
    
    // Substituir o mexe_assim (que não deveria gerar "method" no JavaScript)
    code = code.replace(/mexe_assim\s+([A-Za-z0-9_]+)\s*\(/g, '$1(');
    
    // Outras substituições
    // Substituição adicionais para suportar classes
    code = code.replace(/(\W)ocê(\W)/g, '$1this$2');  // Substitui 'ocê' isolado por 'this'
    
    // Garantir que 'é' funcionem corretamente dentro das classes
    code = code.replace(/(\w+)\.(\w+)\s+é\s+/g, '$1.$2 = ');
    
    // Substituições diretas que precisam acontecer primeiro
    code = code.replace(/\bturma\s+([A-Za-z0-9_]+)/g, 'class $1');
    code = code.replace(/\bocê\b/g, 'this');
    code = code.replace(/\bocê\./g, 'this.');
    code = code.replace(/\.é\s+/g, ' = ');
    
    code = code.replace(/\.quando_resolver\(/g, '.then(');
    code = code.replace(/\.se_der_pobrema\(/g, '.catch(');
    code = code.replace(/\.por_fim\(/g, '.finally(');

    code = code.replace(/\bpromessa\.all\(/g, 'Promise.all(');
    code = code.replace(/\bpromessa\.race\(/g, 'Promise.race(');
    code = code.replace(/\bpromessa\.resolve\(/g, 'Promise.resolve(');
    code = code.replace(/\bpromessa\.reject\(/g, 'Promise.reject(');
    
    // Tokenização e substituição de palavras-chave
    let tokens = code.split(/(\s+|[{}()[\],;:]|"(?:\\"|[^"])*"|'(?:\\'|[^'])*')/);
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i].trim();
      if (token && !token.startsWith('"') && !token.startsWith("'") && 
          !token.startsWith('//') && !token.startsWith('/*') && 
          isNaN(token) && !/^[{}()[\],;:]$/.test(token)) {
        
        const replacement = this.keywords[token];
        if (replacement !== undefined) {
          tokens[i] = tokens[i].replace(token, replacement);
        }
      }
    }
    
    // Tratamento especial para classes e métodos
    code = code.replace(/presta_serviço\s+constructor/g, 'constructor');
    code = code.replace(/presta_serviço\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/g, '$1(');
    
    return tokens.join('');
  }

  execute(code, filename = 'script.gs', showCompiled = false) {
    const jsCode = this.compile(code);
    
    if (showCompiled) {
      console.log("\n=== Código JavaScript gerado ===");
      console.log(jsCode);
      console.log("===============================\n");
    }

    try {
      // Criamos um módulo temporário para executar o código
      const module = { exports: {} };
      const wrapper = `
        (function(module, exports, require) {
          ${jsCode}
        })(module, module.exports, require);
      `;
      
      // Configuramos o contexto de execução
      const context = {
        module: module,
        exports: module.exports,
        require: require,
        __filename: filename,
        __dirname: path.dirname(filename),
        console: console,
        setTimeout: setTimeout,
        setInterval: setInterval,
        clearTimeout: clearTimeout,
        clearInterval: clearInterval,
        Promise: Promise,
        process: process,
        Date: Date
      };
      
      // Executamos o código em um contexto controlado
      const vm = require('vm');
      vm.runInNewContext(wrapper, context);
      
      return module.exports;
    } catch (error) {
      console.error("Vixe! Deu erro ao executar o código:");
      console.error(error);
      process.exit(1);
    }
  }
}

function printUsage() {
  console.log(`
  GoiásScript - A Linguagem Goiana do Interior
  Versão: 1.0.0
  Autor: Gefferson-Souza
  Data: 2025-04-13
  
  Uso: goiasscript [opções] <arquivo.gs>
  
  Opções:
    -h, --help       Mostra essa ajuda
    -v, --version    Mostra a versão
    -c, --compiled   Mostra o código JavaScript gerado
    
  Exemplos:
    goiasscript meuPrograma.gs
    goiasscript --compiled meuPrograma.gs
    
  Funcionalidades:
    - Sintaxe baseada no dialeto goiano do interior
    - Suporte completo a recursos modernos do JavaScript:
      * Classes e herança (arruma_trem, inherda_de)
      * Async/await (vai_na_frente, espera_um_cadim)
      * Promises (promessa, quando_resolver, se_der_pobrema)
      * Programação funcional
    - Integração total com o ecossistema Node.js
    
  Para mais informações, consulte a documentação em:
  https://github.com/Gefferson-Souza/goiasscript
  `);
}

function runFile(filePath, showCompiled = false) {
  try {
    // Verificar se o arquivo existe
    if (!fs.existsSync(filePath)) {
      console.error(`Arquivo não encontrado: ${filePath}`);
      process.exit(1);
    }
    
    // Ler o conteúdo do arquivo
    const code = fs.readFileSync(filePath, 'utf8');
    
    // Compilar e executar
    console.log(`Executando: ${filePath}`);
    const compiler = new GoiasScriptCompiler();
    compiler.execute(code, filePath, showCompiled);
    
  } catch (error) {
    console.error('Erro ao executar o arquivo:', error);
    process.exit(1);
  }
}

// Processar argumentos da linha de comando
function processArgs() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('-h') || args.includes('--help')) {
    printUsage();
    process.exit(0);
  }
  
  if (args.includes('-v') || args.includes('--version')) {
    console.log('GoiásScript v2.0.0');
    process.exit(0);
  }
  
  const showCompiled = args.includes('-c') || args.includes('--compiled');
  
  // Encontrar o arquivo .gs
  const filePath = args.find(arg => arg.endsWith('.gs'));
  
  if (!filePath) {
    console.error('Erro: Nenhum arquivo .gs especificado');
    printUsage();
    process.exit(1);
  }
  
  runFile(filePath, showCompiled);
}

// Executar
processArgs();