// GoianoBuiltins.js - Métodos nativos goianos
// Substitui todos os métodos JavaScript por versões goianas

class GoianoBuiltins {
  constructor() {
    // Tipos goianos mais autênticos
    this.tiposGoianos = {
      string: 'texto',
      number: 'numero',
      boolean: 'booleano',
      array: 'lista',
      object: 'coisa',
      function: 'faz_trem',
      null: 'nada',
      undefined: 'indefinido',
      date: 'data',
      regex: 'padrao',
    };

    // Métodos goianos para substituir JS
    this.metodosGoianos = {
      // String/Texto methods
      replace: 'trocar',
      split: 'dividir',
      join: 'juntar',
      toUpperCase: 'pra_maiusculo',
      toLowerCase: 'pra_minusculo',
      trim: 'aparar',
      includes: 'contem',
      indexOf: 'posicao_de',
      substring: 'pedaco',
      slice: 'fatiar',
      charAt: 'letra_em',
      length: 'tamanho',
      startsWith: 'comeca_com',
      endsWith: 'termina_com',

      // Array/Lista methods
      map: 'mapear',
      filter: 'filtrar',
      reduce: 'reduzir',
      forEach: 'pra_cada',
      push: 'empurrar',
      pop: 'tirar_ultimo',
      shift: 'tirar_primeiro',
      unshift: 'por_primeiro',
      sort: 'ordenar',
      reverse: 'inverter',
      find: 'achar',
      indexOf: 'posicao_de',
      includes: 'contem',
      concat: 'juntar_lista',
      splice: 'emendar',

      // Object/Coisa methods
      keys: 'chaves',
      values: 'valores',
      entries: 'entradas',
      hasOwnProperty: 'tem_propriedade',
      assign: 'misturar',

      // Math methods
      'Math.random': 'sorteio',
      'Math.floor': 'arredondar_baixo',
      'Math.ceil': 'arredondar_cima',
      'Math.round': 'arredondar',
      'Math.max': 'maior',
      'Math.min': 'menor',
      'Math.abs': 'absoluto',
      'Math.sqrt': 'raiz_quadrada',
      'Math.pow': 'potencia',

      // Date methods
      getFullYear: 'pegar_ano',
      getMonth: 'pegar_mes',
      getDate: 'pegar_dia',
      getHours: 'pegar_horas',
      getMinutes: 'pegar_minutos',
      getSeconds: 'pegar_segundos',

      // Console methods
      'console.log': 'prosa',
      'console.error': 'prosa_erro',
      'console.warn': 'prosa_aviso',

      // Global methods
      parseInt: 'vira_numero',
      parseFloat: 'vira_decimal',
      isNaN: 'eh_nao_numero',
      setTimeout: 'depois_de',
      setInterval: 'repetir_a_cada',
      clearTimeout: 'cancelar_depois',
      clearInterval: 'cancelar_repeticao',
    };

    // Métodos proibidos (não-goianos)
    this.metodosProibidos = [
      'replace',
      'split',
      'join',
      'toUpperCase',
      'toLowerCase',
      'trim',
      'map',
      'filter',
      'reduce',
      'forEach',
      'push',
      'pop',
      'shift',
      'Math.random',
      'Math.floor',
      'console.log',
      'parseInt',
      'setTimeout',
    ];
  }

  // Gera código JavaScript equivalente para métodos goianos
  gerarImplementacaoGoiana() {
    return `
// 🇧🇷 MÉTODOS NATIVOS GOIANOS - GoiásScript v1.5
// Implementação dos métodos goianos que substituem JavaScript

// Constantes booleanas goianas
const certeza = true;
const de_jeito_nenhum = false;

// Métodos para TEXTO (String)
String.prototype.trocar = function(buscar, substituir) {
  return this.replace(new RegExp(buscar, 'g'), substituir);
};

String.prototype.dividir = function(separador) {
  return this.split(separador);
};

String.prototype.pra_maiusculo = function() {
  return this.toUpperCase();
};

String.prototype.pra_minusculo = function() {
  return this.toLowerCase();
};

String.prototype.aparar = function() {
  return this.trim();
};

String.prototype.contem = function(texto) {
  return this.includes(texto);
};

String.prototype.posicao_de = function(texto) {
  return this.indexOf(texto);
};

String.prototype.pedaco = function(inicio, fim) {
  return this.substring(inicio, fim);
};

String.prototype.fatiar = function(inicio, fim) {
  return this.slice(inicio, fim);
};

String.prototype.letra_em = function(posicao) {
  return this.charAt(posicao);
};

String.prototype.tamanho = function() {
  return this.length;
};

String.prototype.comeca_com = function(texto) {
  return this.startsWith(texto);
};

String.prototype.termina_com = function(texto) {
  return this.endsWith(texto);
};

// Métodos para LISTA (Array)  
Array.prototype.mapear = function(callback) {
  return this.map(callback);
};

Array.prototype.filtrar = function(callback) {
  return this.filter(callback);
};

Array.prototype.reduzir = function(callback, inicial) {
  return this.reduce(callback, inicial);
};

Array.prototype.pra_cada = function(callback) {
  return this.forEach(callback);
};

Array.prototype.empurrar = function(...items) {
  return this.push(...items);
};

Array.prototype.tirar_ultimo = function() {
  return this.pop();
};

Array.prototype.tirar_primeiro = function() {
  return this.shift();
};

Array.prototype.por_primeiro = function(...items) {
  return this.unshift(...items);
};

Array.prototype.ordenar = function(callback) {
  return this.sort(callback);
};

Array.prototype.inverter = function() {
  return this.reverse();
};

Array.prototype.achar = function(callback) {
  return this.find(callback);
};

Array.prototype.posicao_de = function(item) {
  return this.indexOf(item);
};

Array.prototype.contem = function(item) {
  return this.includes(item);
};

Array.prototype.juntar_lista = function(...arrays) {
  return this.concat(...arrays);
};

Array.prototype.emendar = function(inicio, quantidade, ...items) {
  return this.splice(inicio, quantidade, ...items);
};

Array.prototype.tamanho = function() {
  return this.length;
};

Array.prototype.juntar = function(separador = '') {
  return this.join(separador);
};

// Métodos para COISA (Object)
Object.chaves = function(obj) {
  return Object.keys(obj);
};

Object.valores = function(obj) {
  return Object.values(obj);
};

Object.entradas = function(obj) {
  return Object.entries(obj);
};

Object.prototype.tem_propriedade = function(prop) {
  return this.hasOwnProperty(prop);
};

Object.misturar = function(target, ...sources) {
  return Object.assign(target, ...sources);
};

// Métodos MATEMÁTICOS — definidos em forma de atribuição
// para que GoianoMath.<metodo> apareça literalmente no runtime gerado
const GoianoMath = {};
GoianoMath.sorteio = () => Math.random();
GoianoMath.arredondar_baixo = (num) => Math.floor(num);
GoianoMath.arredondar_cima = (num) => Math.ceil(num);
GoianoMath.arredondar = (num) => Math.round(num);
GoianoMath.maior = (...nums) => Math.max(...nums);
GoianoMath.menor = (...nums) => Math.min(...nums);
GoianoMath.absoluto = (num) => Math.abs(num);
GoianoMath.raiz_quadrada = (num) => Math.sqrt(num);
GoianoMath.potencia = (base, exp) => Math.pow(base, exp);
GoianoMath.PI = Math.PI;
GoianoMath.E = Math.E;

// Métodos de DATA
Date.prototype.pegar_ano = function() {
  return this.getFullYear();
};

Date.prototype.pegar_mes = function() {
  return this.getMonth();
};

Date.prototype.pegar_dia = function() {
  return this.getDate();
};

Date.prototype.pegar_horas = function() {
  return this.getHours();
};

Date.prototype.pegar_minutos = function() {
  return this.getMinutes();
};

Date.prototype.pegar_segundos = function() {
  return this.getSeconds();
};

// Funções GLOBAIS goianas
function vira_numero(str) {
  return parseInt(str);
}

function vira_decimal(str) {
  return parseFloat(str);
}

function eh_nao_numero(val) {
  return isNaN(val);
}

function depois_de(callback, tempo) {
  return setTimeout(callback, tempo);
}

function repetir_a_cada(callback, tempo) {
  return setInterval(callback, tempo);
}

function cancelar_depois(id) {
  return clearTimeout(id);
}

function cancelar_repeticao(id) {
  return clearInterval(id);
}

// Console goiano
function prosa(...args) {
  console.log(...args);
}

function prosa_erro(...args) {
  console.error(...args);
}

function prosa_aviso(...args) {
  console.warn(...args);
}

// Expor métodos goianos globalmente
globalThis.GoianoMath = GoianoMath;
globalThis.prosa = prosa;
globalThis.prosa_erro = prosa_erro;
globalThis.prosa_aviso = prosa_aviso;
globalThis.vira_numero = vira_numero;
globalThis.vira_decimal = vira_decimal;
globalThis.eh_nao_numero = eh_nao_numero;
globalThis.depois_de = depois_de;
globalThis.repetir_a_cada = repetir_a_cada;
globalThis.cancelar_depois = cancelar_depois;
globalThis.cancelar_repeticao = cancelar_repeticao;
`;
  }

  // Verifica se um método é proibido (não-goiano)
  ehMetodoProibido(metodo) {
    return this.metodosProibidos.includes(metodo);
  }

  // Converte método JavaScript para goiano
  converterParaGoiano(metodoJs) {
    return this.metodosGoianos[metodoJs] || metodoJs;
  }

  // Converte tipo JavaScript para goiano
  converterTipoParaGoiano(tipoJs) {
    return this.tiposGoianos[tipoJs] || tipoJs;
  }

  // Lista todos os métodos goianos disponíveis
  listarMetodosGoianos() {
    return Object.values(this.metodosGoianos);
  }

  // Lista todos os tipos goianos
  listarTiposGoianos() {
    return Object.values(this.tiposGoianos);
  }

  // Obter equivalente goiano para método JS
  obterEquivalenteGoiano(metodoJs) {
    return this.metodosGoianos[metodoJs] || null;
  }

  // Detectar métodos proibidos em código
  detectarMetodosProibidos(codigo) {
    const metodosEncontrados = [];
    this.metodosProibidos.forEach(metodo => {
      const regex = new RegExp(`\\.${metodo}\\s*\\(`, 'g');
      if (regex.test(codigo)) {
        metodosEncontrados.push(metodo);
      }
    });
    return metodosEncontrados;
  }

  // Obter documentação de método goiano
  obterDocumentacaoMetodo(metodo) {
    const docs = {
      trocar: 'trocar: substitui todas as ocorrências de uma substring por outra',
      mapear:
        'mapear: cria um novo array com os resultados da chamada de uma função para cada elemento',
      filtrar: 'filtrar: cria um novo array com todos os elementos que passaram no teste',
      reduzir: 'reduzir: executa uma função redutora em cada elemento do array',
      empurrar: 'empurrar: adiciona um ou mais elementos ao final de um array',
    };
    return docs[metodo] || `Documentação não disponível para ${metodo}`;
  }

  // Obter exemplo de uso de método
  obterExemploUso(metodo) {
    const exemplos = {
      trocar: 'texto.trocar("a", "e")',
      mapear: 'lista.mapear(x => x * 2)',
      filtrar: 'lista.filtrar(x => x > 10)',
      reduzir: 'lista.reduzir((a, b) => a + b)',
      empurrar: 'lista.empurrar(novoElemento)',
    };
    return exemplos[metodo] || `Exemplo não disponível para ${metodo}`;
  }

  // Verificar se método é otimizado
  ehMetodoOtimizado(metodo) {
    const metodosOtimizados = ['mapear', 'filtrar', 'reduzir', 'trocar'];
    return metodosOtimizados.includes(metodo);
  }

  // Obter versão otimizada de método
  obterVersaoOtimizada(metodo) {
    if (!this.ehMetodoOtimizado(metodo)) {
      return null;
    }
    return `// Versão otimizada de ${metodo} com melhor performance\n// Utiliza algoritmos nativos quando possível`;
  }
}

module.exports = GoianoBuiltins;
