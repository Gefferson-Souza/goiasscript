'use strict';
const L = (...lines) => lines.join('\n');

// Casos em que o `gs` é JS válido: o esperado é o stdout do MESMO código rodando como JS puro.
// O transpilador reescreve .length/.map/.slice/... para métodos goianos e depende de wrappers do runtime.
module.exports = [
  // ---------- .length ----------
  { id: 'M01', grupo: 'reescrita', titulo: '`arr.length = 0` (atribuição ao length)', gs: L('uai a é [1, 2, 3];', 'a.length é 0;', 'prosa(a.length);'), esperado: '0', sev: 'MEDIUM', classe: 'defeito', nota: 'vira `a.tamanho() = 0`' },
  { id: 'M02', grupo: 'reescrita', titulo: 'objeto do usuário com propriedade `length`', gs: 'uai o é { length: 3 }; prosa(o.length);', esperado: '3', sev: 'HIGH', classe: 'defeito' },
  { id: 'M03', grupo: 'reescrita', titulo: '`arguments.length`', gs: 'faz_trem f() { faz_favor arguments.length; } prosa(f(1, 2, 3));', esperado: '3', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'M04', grupo: 'reescrita', titulo: '`Uint8Array.length`', gs: 'prosa((faz_um Uint8Array(4)).length);', esperado: '4', sev: 'LOW', classe: 'defeito' },
  { id: 'M05', grupo: 'reescrita', titulo: '`fn.length` (aridade)', gs: 'prosa((faz_trem(a, b) {}).length);', esperado: '2', sev: 'LOW', classe: 'defeito' },
  { id: 'M06', grupo: 'reescrita', titulo: '`.length` em array e string (controle)', gs: 'prosa([1, 2, 3].length, "abcd".length);', esperado: '3 4', classe: 'controle' },
  { id: 'M07', grupo: 'reescrita', titulo: 'getter `length` em classe do usuário', gs: L('arruma_trem Fila {', '  aprepara_trem() { ocê.xs é [1, 2]; }', '  get length() { faz_favor ocê.xs.length; }', '}', 'prosa(faz_um Fila().length);'), esperado: '2', sev: 'MEDIUM', classe: 'defeito' },

  // ---------- métodos que existem só em uma das receptoras ----------
  { id: 'M10', grupo: 'reescrita', titulo: '`array.slice(1)`', gs: 'prosa([1, 2, 3].slice(1));', esperado: '[ 2, 3 ]', sev: 'HIGH', classe: 'defeito', nota: '`fatiar` só existe em String.prototype' },
  { id: 'M11', grupo: 'reescrita', titulo: '`"abc".concat("d")`', gs: 'prosa("abc".concat("d"));', esperado: 'abcd', sev: 'MEDIUM', classe: 'defeito', nota: '`juntar_lista` só existe em Array.prototype' },
  { id: 'M12', grupo: 'reescrita', titulo: '`Map.forEach`', gs: L('uai m é faz_um Map([[1, 2]]);', 'm.forEach((v, k) => prosa(k, v));'), esperado: '1 2', sev: 'HIGH', classe: 'defeito', nota: '`pra_cada` só existe em Array.prototype' },
  { id: 'M13', grupo: 'reescrita', titulo: '`Set.forEach`', gs: 'faz_um Set([1, 2]).forEach(v => prosa(v));', esperado: '1\n2', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'M14', grupo: 'reescrita', titulo: '`Number.isNaN` (isNaN( sem \\b)', gs: 'prosa(Number.isNaN(NaN), isNaN("x"));', esperado: 'true true', sev: 'HIGH', classe: 'defeito', nota: 'regex `isNaN\\s*\\(` casa dentro de `Number.isNaN(`' },
  { id: 'M15', grupo: 'reescrita', titulo: '`Number.parseFloat` / `Number.parseInt`', gs: 'prosa(Number.parseFloat("1.5"), Number.parseInt("7"));', esperado: '1.5 7', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'M16', grupo: 'reescrita', titulo: '`globalThis.setTimeout(...)`', gs: 'globalThis.setTimeout(() => prosa("tic"), 1);', esperado: 'tic', classe: 'controle', nota: 'funciona porque o runtime publica depois_de em globalThis' },

  // ---------- wrappers que descartam argumentos / mudam semântica ----------
  { id: 'M20', grupo: 'wrapper', titulo: '`reduzir` sem valor inicial (exemplo do METODOS_GOIANOS.md)', gs: 'prosa([1, 2, 3, 4, 5].reduzir((a, b) => a mais b));', esperado: '15', sev: 'HIGH', classe: 'defeito', nota: 'wrapper passa `inicial` = undefined explícito para Array.prototype.reduce' },
  { id: 'M21', grupo: 'wrapper', titulo: '`.reduce` (JS) sem valor inicial', gs: 'prosa([1, 2, 3].reduce((a, b) => a + b));', esperado: '6', sev: 'HIGH', classe: 'defeito' },
  { id: 'M22', grupo: 'wrapper', titulo: '`splice(1)` (sem deleteCount)', gs: L('uai a é [1, 2, 3];', 'a.splice(1);', 'prosa(a);'), esperado: '[ 1 ]', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'M23', grupo: 'wrapper', titulo: '`join()` sem separador', gs: 'prosa([1, 2, 3].join());', esperado: '1,2,3', sev: 'MEDIUM', classe: 'defeito', nota: 'juntar(separador = "") muda o default do JS' },
  { id: 'M24', grupo: 'wrapper', titulo: '`parseInt("ff", 16)` (radix descartado)', gs: 'prosa(parseInt("ff", 16), parseInt("101", 2));', esperado: '255 5', sev: 'HIGH', classe: 'defeito' },
  { id: 'M25', grupo: 'wrapper', titulo: '`indexOf(x, from)`', gs: 'prosa("abab".indexOf("a", 1), [1, 2, 1].indexOf(1, 1));', esperado: '2 2', sev: 'LOW', classe: 'defeito' },
  { id: 'M26', grupo: 'wrapper', titulo: '`split(sep, limit)`', gs: 'prosa("a,b,c".split(",", 2));', esperado: "[ 'a', 'b' ]", sev: 'LOW', classe: 'defeito' },
  { id: 'M27', grupo: 'wrapper', titulo: '`setTimeout(fn, ms, arg)` — args extras descartados', gs: 'setTimeout((x) => prosa("arg:", x), 1, "ok");', esperado: 'arg: ok', sev: 'LOW', classe: 'defeito' },
  { id: 'M28', grupo: 'wrapper', titulo: '`forEach(fn, thisArg)`', gs: L('uai o é { k: 7 };', '[1].forEach(function (x) { prosa(this.k); }, o);'), esperado: '7', sev: 'LOW', classe: 'defeito' },

  // ---------- .replace -> trocar (regex a partir de string) ----------
  { id: 'M30', grupo: 'trocar', titulo: '`"1.5".replace(".", ",")` (vírgula decimal)', gs: 'prosa("1.5".replace(".", ","));', esperado: '1,5', sev: 'HIGH', classe: 'defeito', nota: 'trocar() faz new RegExp(buscar): "." casa qualquer caractere' },
  { id: 'M31', grupo: 'trocar', titulo: '`"a.b.c".trocar(".", "-")` (API goiana documentada)', gs: 'prosa("a.b.c".trocar(".", "-"));', esperado: 'a-b-c', sev: 'HIGH', classe: 'defeito' },
  { id: 'M32', grupo: 'trocar', titulo: '`"f(x)".replace("(", "[")` — metacaractere inválido', gs: 'prosa("f(x)".replace("(", "["));', esperado: 'f[x)', sev: 'HIGH', classe: 'defeito' },
  { id: 'M33', grupo: 'trocar', titulo: '`"a+b".replace("+", " mais ")`', gs: 'prosa("a+b".replace("+", " mais "));', esperado: 'a mais b', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'M34', grupo: 'trocar', titulo: 'flag `i` do regex é descartada', gs: 'prosa("aXb".replace(/x/i, "-"));', esperado: 'a-b', sev: 'HIGH', classe: 'defeito', nota: 'new RegExp(/x/i, "g") sobrescreve as flags' },
  { id: 'M35', grupo: 'trocar', titulo: 'regex sem /g troca só a 1ª ocorrência (semântica do JS)', gs: 'prosa("aaa".replace(/a/, "b"));', esperado: 'baa', sev: 'MEDIUM', classe: 'defeito', nota: 'trocar força /g (documentado para trocar, mas aplicado silenciosamente ao .replace do JS)' },
  { id: 'M36', grupo: 'trocar', titulo: 'replace com função de callback', gs: 'prosa("a1b2".replace(/\\d/g, d => "<" + d + ">"));', esperado: 'a<1>b<2>', classe: 'controle' },

  // ---------- colisão com métodos do próprio usuário ----------
  { id: 'M40', grupo: 'colisao', titulo: 'classe do usuário com métodos push/find (chamada reescrita, definição não)', gs: L(
    'arruma_trem Pilha {',
    '  aprepara_trem() { ocê.itens é []; }',
    '  push(x) { ocê.itens.push(x); }',
    '  find(pred) { faz_favor ocê.itens.find(pred); }',
    '}',
    'uai p é faz_um Pilha();',
    'p.push(1);',
    'p.push(2);',
    'prosa(p.find(x => x maior_que 1));'), esperado: '2', sev: 'HIGH', classe: 'defeito', nota: 'definições `push(x) {` não são reescritas, chamadas `.push(` são' },
  { id: 'M41', grupo: 'colisao', titulo: 'objeto literal com método `map` chamado depois', gs: L('uai r é { map(f) { faz_favor f(1); } };', 'prosa(r.map(x => x mais 1));'), esperado: '2', sev: 'HIGH', classe: 'defeito' },
  { id: 'M42', grupo: 'colisao', titulo: 'usuário define `empurrar` e chama `.push` de outra coisa', gs: L('uai q é { empurrar(x) { faz_favor "meu:" mais x; } };', 'prosa(q.empurrar(1), [].push(1));'), esperado: 'meu:1 1', classe: 'controle' },

  // ---------- controles: reescritas que funcionam ----------
  { id: 'M50', grupo: 'reescrita', titulo: 'strings: toUpperCase/trim/split/join/startsWith/endsWith/includes/indexOf/charAt/substring/slice', expectFromPlainJs: true, gs: 'console.log(" a b ".trim().toUpperCase().split(" ").join("-"), "abcdef".slice(2), "abcdef".substring(1, 3), "abc".charAt(1), "abc".startsWith("a"), "abc".endsWith("c"), "abc".includes("b"), "abc".indexOf("c"));', classe: 'controle' },
  { id: 'M51', grupo: 'reescrita', titulo: 'arrays: filter/map/reduce(c/ inicial)/sort/reverse/find/push/pop/shift/unshift/concat', expectFromPlainJs: true, gs: 'const a = [4, 1, 3]; a.push(9); a.unshift(0); console.log(a.pop(), a.shift(), a.filter(x => x > 1).map(x => x * 10).reduce((s, x) => s + x, 0), [3, 1, 2].sort(), [1, 2, 3].reverse(), [1, 2, 3].find(x => x > 1), [1].concat([2], [3]));', classe: 'controle' },
  { id: 'M52', grupo: 'reescrita', titulo: 'Object.keys/values/entries/assign + hasOwnProperty', expectFromPlainJs: true, gs: 'const o = { a: 1, b: 2 }; console.log(Object.keys(o), Object.values(o), Object.entries(o), Object.assign({}, o, { c: 3 }), o.hasOwnProperty("a"));', classe: 'controle' },
  { id: 'M53', grupo: 'reescrita', titulo: 'Math: floor/ceil/round/max/min/abs/sqrt/pow/PI/E/random', expectFromPlainJs: true, gs: 'console.log(Math.floor(2.7), Math.ceil(2.1), Math.round(2.5), Math.max(1, 5, 3), Math.min(4, 2), Math.abs(-3), Math.sqrt(16), Math.pow(2, 10), Math.PI.toFixed(2), Math.E.toFixed(2), typeof Math.random());', classe: 'controle' },
  { id: 'M54', grupo: 'reescrita', titulo: 'console.error / console.warn diretos', gs: 'console.error("e"); console.warn("w");', esperado: 'e\nw', classe: 'controle' },
  { id: 'M55', grupo: 'reescrita', titulo: 'Date: getFullYear etc. nativos e pegar_* goianos', gs: 'uai d é faz_um Date(2020, 0, 15, 10, 20, 30); prosa(d.getFullYear(), d.pegar_ano(), d.pegar_mes(), d.pegar_dia());', esperado: '2020 2020 0 15', classe: 'controle' },
];
