#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * GoiásScript v2 - Compilador mais robusto para a linguagem goiana
 * @author Gefferson-Souza
 * @date 2025-04-13
 */

// Classe de erro personalizada em estilo goiano
class ErroGoiano extends Error {
  constructor(tipo, mensagem, dica, linha, coluna, arquivo) {
    // Mapear tipos de erro para expressões goianas
    const tipoTraduzido = {
      "sintaxe": "sintaxe torta",
      "referencia": "trem que não existe",
      "tipo": "tipo errado de trem",
      "execucao": "execução deu ruim",
      "falta_virgula": "faltou ponto-e-vírgula",
      "falta_parentese": "faltou um parêntese",
      "falta_chave": "faltou uma chave",
      "erro_nome": "nome tá errado",
      "divisao_zero": "dividiu por zero",
      "argumento_invalido": "parâmetro não tá bão",
      "promessa_rejeitada": "promessa não cumprida",
      "importacao": "importação deu problema",
      "interno": "algo deu errado no sistema"
    }[tipo] || "trem desconhecido";
    
    // Construir a mensagem de erro em estilo goiano
    let mensagemCompleta = `Ô gente! Deu ${tipoTraduzido}`;
    
    if (arquivo) {
      mensagemCompleta += ` no arquivo "${arquivo}"`;
    }
    
    if (linha !== undefined) {
      mensagemCompleta += ` na linha ${linha}`;
      if (coluna !== undefined) {
        mensagemCompleta += `, coluna ${coluna}`;
      }
    }
    
    mensagemCompleta += `: ${mensagem}`;
    
    super(mensagemCompleta);
    
    this.name = "ErroGoiano";
    this.tipo = tipo;
    this.dica = dica;
    this.linha = linha;
    this.coluna = coluna;
    this.arquivo = arquivo;
  }
  
  // Método para mostrar o erro com estilo goiano
  mostrarErro() {
    console.error(`\n🤠 ${this.name}: ${this.message}`);
    
    if (this.dica) {
      console.error(`\n💡 Dica goiana: ${this.dica}`);
    }
    
    console.error(); // Linha em branco para melhor legibilidade
  }
}

// Função para traduzir erros de JavaScript para erros goianos
function traduzirErroJS(erro, arquivo) {
  // Erros GoiásScript personalizados já estão no formato correto
  if (erro instanceof ErroGoiano) {
    return erro;
  }
  
  // Extrair informações do erro JS
  let linha = erro.lineNumber;
  let coluna = erro.columnNumber;
  const mensagemOriginal = erro.message;
  const stack = erro.stack;
  
  // Extrair linha/coluna do stack trace se não estiverem disponíveis diretamente
  if (linha === undefined && stack) {
    const match = stack.match(/:(\d+):(\d+)/);
    if (match) {
      linha = parseInt(match[1], 10);
      coluna = parseInt(match[2], 10);
    }
  }
  
  // Variáveis para o erro goiano
  let tipoErro = "execucao";
  let mensagemGoiana = mensagemOriginal; // Por padrão, mantenha a mensagem original
  let dica = null;
  
  // SyntaxError - Erros de sintaxe
  if (erro instanceof SyntaxError) {
    tipoErro = "sintaxe";
    
    if (mensagemOriginal.includes("Unexpected token")) {
      const token = mensagemOriginal.match(/Unexpected token '(.+?)'/)?.[1] || "desconhecido";
      mensagemGoiana = `Achei um '${token}' onde não deveria ter!`;
      dica = "Vê se não escreveu alguma coisa fora do lugar ou esqueceu de fechar parênteses, chaves ou colchetes.";
    } 
    else if (mensagemOriginal.includes("Unexpected identifier")) {
      const id = mensagemOriginal.match(/Unexpected identifier '(.+?)'/)?.[1] || "";
      mensagemGoiana = `Esse identificador '${id}' tá no lugar errado!`;
      dica = "Vê se não tá faltando uma vírgula, ponto-e-vírgula ou operador entre as palavras.";
    }
    else if (mensagemOriginal.includes("Unexpected end of input")) {
      mensagemGoiana = "O código acabou antes da hora, uai!";
      dica = "Parece que ocê esqueceu de fechar alguma chave {} ou parêntese () em algum lugar.";
    }
    else if (mensagemOriginal.includes("Missing initializer")) {
      mensagemGoiana = "Declarou a variável mas esqueceu de dar um valor pra ela!";
      dica = "Tem que colocar o 'é' depois da variável. Por exemplo: 'uai x é 10;'";
    }
    else if (mensagemOriginal.includes("Invalid or unexpected token")) {
      mensagemGoiana = "Tem uma letra ou símbolo aí que eu não entendi, sô!";
      dica = "Verifique se tem algum caractere esquisito ou aspas abertas sem fechar.";
    }
    else {
      mensagemGoiana = "Sintaxe tá embrulhada que nem pamonha!";
      dica = "Dá uma olhada boa no código que deve ter algo errado na escrita.";
    }
  } 
  // ReferenceError - Variáveis ou funções não definidas
  else if (erro instanceof ReferenceError || mensagemOriginal.includes("is not defined")) {
    tipoErro = "referencia";
    
    if (mensagemOriginal.includes("is not defined")) {
      const varName = mensagemOriginal.match(/(\w+) is not defined/)?.[1] || "";
      mensagemGoiana = `Esse trem '${varName}' não existe por aqui, uai!`;
      dica = "Ocê precisa declarar ele com 'uai' ou 'trem' antes de usar, ou então errou o nome.";
    }
    else {
      mensagemGoiana = "Ocê tá usando um trem que não existe!";
      dica = "Confira se escreveu certo o nome da variável ou função.";
    }
  } 
  // TypeError - Operações com tipos incompatíveis
  else if (erro instanceof TypeError) {
    tipoErro = "tipo";
    
    if (mensagemOriginal.includes("is not a function")) {
      const funcName = mensagemOriginal.match(/(\w+) is not a function/)?.[1] || "";
      mensagemGoiana = `'${funcName}' não é uma função, não dá pra chamar assim não!`;
      dica = "Vê se não tá confundindo variável com função. Funções são chamadas com parênteses, tipo: nomeDaFuncao()";
    }
    else if (mensagemOriginal.includes("Cannot read property") || mensagemOriginal.includes("Cannot read properties")) {
      const propMatch = mensagemOriginal.match(/property '(.+?)' of/) || mensagemOriginal.match(/properties of (.+?)[^\w]/);
      const prop = propMatch ? propMatch[1] : "desconhecida";
      mensagemGoiana = `Não consigo ler essa propriedade '${prop}'. O trem tá vazio ou não existe!`;
      dica = "Vê se a variável não tá vazia (null/undefined) antes de tentar usar propriedades dela.";
    }
    else if (mensagemOriginal.includes("is not iterable")) {
      mensagemGoiana = "Esse trem não é uma lista, não dá pra percorrer ele assim!";
      dica = "Só pode usar 'vai_indo' com arrays, objetos e outros trens que são iteráveis.";
    }
    else if (mensagemOriginal.includes("is not a constructor")) {
      mensagemGoiana = "Esse trem não é um tipo, não dá pra criar com 'faz_um'!";
      dica = "Só pode usar 'faz_um' com classes ou funções que possam criar objetos.";
    }
    else {
      mensagemGoiana = "Ocê tá tentando usar o trem do jeito errado!";
      dica = "Veja se não tá confundindo os tipos. Não dá pra somar string com número ou chamar método de algo que não existe.";
    }
  }
  // URIError - Manipulação de URIs
  else if (erro instanceof URIError) {
    tipoErro = "uri";
    mensagemGoiana = "Esse endereço de internet tá todo embrulhado!";
    dica = "Tem caractere esquisito na URL que não consigo entender.";
  }
  // RangeError - Valores fora do intervalo permitido
  else if (erro instanceof RangeError) {
    tipoErro = "intervalo";
    
    if (mensagemOriginal.includes("Maximum call stack size exceeded")) {
      mensagemGoiana = "O código tá chamando ele mesmo mais que comitiva em festa!";
      dica = "Ocê tem uma função que tá chamando ela mesma sem parar. Isso se chama recursão infinita.";
    }
    else if (mensagemOriginal.toLowerCase().includes("precision")) {
      mensagemGoiana = "Número com precisão exagerada demais!";
      dica = "Não precisa de tantas casas decimais assim, sô!";
    }
    else {
      mensagemGoiana = "Esse número tá fora do limite, uai!";
      dica = "Vê se não tá usando um valor muito grande ou muito pequeno para o que é permitido.";
    }
  }
  // Promessas rejeitadas
  else if (erro.name === "UnhandledPromiseRejectionWarning") {
    tipoErro = "promessa_rejeitada";
    mensagemGoiana = "Uma promessa não foi cumprida e ninguém tratou!";
    dica = "Use 'se_der_pobrema' ou 'tenta_aí/se_der_ruim' para pegar os erros das promessas.";
  }
  // Erros específicos de divisão por zero
  else if (mensagemOriginal.includes("divide by zero") || mensagemOriginal.includes("division by zero")) {
    tipoErro = "divisao_zero";
    mensagemGoiana = "Tá querendo dividir por zero? Nem Deus faz isso, sô!";
    dica = "Verifique se o divisor não tá zerado antes de fazer a conta.";
  }
  // Erros de importação ou módulo
  else if (mensagemOriginal.includes("Cannot find module")) {
    tipoErro = "importacao";
    const moduleName = mensagemOriginal.match(/Cannot find module '(.+?)'/)?.[1] || "";
    mensagemGoiana = `Não achei esse módulo '${moduleName}' em lugar nenhum!`;
    dica = "Vê se o módulo tá instalado ou se o nome do arquivo tá escrito certo.";
  }
  // Erro interno
  else {
    mensagemGoiana = `Erro não identificado: ${mensagemOriginal}`;
    dica = "Esse tipo de erro é meio cabrero de entender. Tenta ver o que causou ele.";
  }
  
  return new ErroGoiano(tipoErro, mensagemGoiana, dica, linha, coluna, arquivo);
}

// Palavra-chave vixe_que para criar erro personalizado
function vixeGoiano(mensagem, tipo = "execucao", dica = null) {
  throw new ErroGoiano(tipo, mensagem, dica);
}

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
      'vixe_que': 'vixeGoiano',
      
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
        Date: Date,
        // Adicionar a função de erro personalizado ao contexto
        vixeGoiano: vixeGoiano
      };
      
      // Executamos o código em um contexto controlado
      const vm = require('vm');
      vm.runInNewContext(wrapper, context);
      
      return module.exports;
    } catch (error) {
      // Traduzir erro JavaScript para erro no estilo goiano
      const erroGoiano = traduzirErroJS(error, filename);
      
      // Exibir o erro com estilo goiano
      erroGoiano.mostrarErro();
      
      // Exibir a pilha de chamadas original se for modo de depuração
      if (showCompiled) {
        console.error("\n=== Pilha de chamadas original ===");
        console.error(error.stack);
        console.error("================================\n");
      }
      
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