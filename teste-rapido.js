
// 🇧🇷 MÉTODOS NATIVOS GOIANOS - GoiásScript v2.0
// Implementação dos métodos goianos que substituem JavaScript

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

// Métodos MATEMÁTICOS
const GoianoMath = {
  sorteio: () => Math.random(),
  arredondar_baixo: (num) => Math.floor(num),
  arredondar_cima: (num) => Math.ceil(num),
  arredondar: (num) => Math.round(num),
  maior: (...nums) => Math.max(...nums),
  menor: (...nums) => Math.min(...nums),
  absoluto: (num) => Math.abs(num),
  raiz_quadrada: (num) => Math.sqrt(num),
  potencia: (base, exp) => Math.pow(base, exp),
  PI: Math.PI,
  E: Math.E
};

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


console.log("Opa, sô\! GoiásScript funcionando\!");
