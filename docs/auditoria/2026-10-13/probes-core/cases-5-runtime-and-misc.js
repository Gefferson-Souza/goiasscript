'use strict';
const h = require('./harness');
const L = (...lines) => lines.join('\n');

module.exports = [
  // ---------- efeitos colaterais do runtime injetado ----------
  { id: 'K01', grupo: 'runtime', titulo: 'for...in sobre objeto enumera `tem_propriedade` (Object.prototype enumerável)', gs: L('uai o é { a: 1, b: 2 };', 'vai_indo (uai k em o) { prosa(k); }'), esperado: 'a\nb', sev: 'HIGH', classe: 'defeito', nota: 'atribuição simples a Object.prototype.tem_propriedade cria propriedade enumerável' },
  { id: 'K02', grupo: 'runtime', titulo: 'for...in sobre array enumera índices + métodos goianos', gs: L('uai l é [10, 20];', 'vai_indo (uai i em l) { prosa(i); }'), esperado: '0\n1', sev: 'HIGH', classe: 'defeito' },
  { id: 'K03', grupo: 'runtime', titulo: 'for...in sobre string', gs: L('vai_indo (uai i em "ab") { prosa(i); }'), esperado: '0\n1', sev: 'MEDIUM', classe: 'defeito' },
  { id: 'K04', grupo: 'runtime', titulo: 'mapa de contagem indexado por chave "tem_propriedade"', gs: L('uai c é {};', 'c["tem_propriedade"] é (c["tem_propriedade"] || 0) mais 1;', 'prosa(c["tem_propriedade"]);'), esperado: '1', sev: 'LOW', classe: 'defeito' },
  { id: 'K05', grupo: 'runtime', titulo: 'usuário declara `uai GoianoMath` (colisão com const do runtime)', gs: 'uai GoianoMath é 1; prosa(GoianoMath);', esperado: '1', sev: 'LOW', classe: 'limite-de-design' },
  { id: 'K06', grupo: 'runtime', titulo: 'usuário declara `uai certeza é 1` (const duplicado + keyword)', gs: 'uai certeza2 é certeza; prosa(certeza2);', esperado: 'true', classe: 'controle' },
  {
    id: 'K07',
    grupo: 'runtime',
    titulo: 'executar o JS gerado duas vezes no mesmo escopo global (REPL / playground que reaproveita contexto)',
    custom: async () => {
      const r = h.transpile('prosa("oi");');
      const vm = require('vm');
      const ctx = vm.createContext({ console: { log: () => {} } });
      vm.runInContext(r.code, ctx);
      try {
        vm.runInContext(r.code, ctx);
        return { ok: true, entrada: 'prosa("oi"); (2x no mesmo contexto)', saida: '(runtime + código)', exec: 'ok' };
      } catch (error) {
        return { ok: false, entrada: 'prosa("oi"); (2x no mesmo contexto)', saida: '(runtime + código)', exec: `ERRO ${error.name}: ${error.message}`, detalhe: 'const certeza/de_jeito_nenhum/GoianoMath no topo do script não são re-declaráveis' };
      }
    },
    sev: 'LOW',
    classe: 'defeito',
    nota: 'latente: os consumidores do repositório avaliam em escopo novo (eval em método de classe, new Function); afeta quem executar o JS gerado como script clássico no mesmo realm',
  },

  // ---------- JS puro (o transpilador diz aceitar JS válido) ----------
  { id: 'P01', grupo: 'js-puro', titulo: 'classes/extends/super/template sem palavras reservadas goianas', expectFromPlainJs: true, gs: 'class Animal { constructor(nome) { this.nome = nome; } falar() { return `${this.nome} faz barulho`; } }\nclass Cachorro extends Animal { falar() { return `${super.falar()} - au au`; } }\nconsole.log(new Cachorro("Rex").falar());', classe: 'controle' },
  { id: 'P02', grupo: 'js-puro', titulo: 'copiar e ordenar array: l.slice().sort()', expectFromPlainJs: true, gs: 'const l = [3, 1, 2];\nconsole.log(l.slice().sort(), l.length);', sev: 'HIGH', classe: 'defeito' },
  { id: 'P03', grupo: 'js-puro', titulo: 'destructuring, rest e spread', expectFromPlainJs: true, gs: 'const { a, ...resto } = { a: 1, b: 2, c: 3 };\nconsole.log(a, resto, [..."abc"].length);', classe: 'controle' },
  { id: 'P04', grupo: 'js-puro', titulo: 'async/await + Promise.then', expectFromPlainJs: true, gs: 'async function f() { return await Promise.resolve(7); }\nf().then(v => console.log("async", v));', classe: 'controle' },
  { id: 'P05', grupo: 'js-puro', titulo: 'generators + spread', expectFromPlainJs: true, gs: 'function* g() { yield 1; yield 2; }\nconsole.log([...g()]);', classe: 'controle' },
  { id: 'P06', grupo: 'js-puro', titulo: 'Map/Set com forEach e size', expectFromPlainJs: true, gs: 'const m = new Map([[1, "a"]]);\nm.forEach((v, k) => console.log(k, v));\nconsole.log(new Set([1, 2, 2]).size);', sev: 'HIGH', classe: 'defeito' },
  { id: 'P07', grupo: 'js-puro', titulo: 'formatação numérica: replace de ponto por vírgula', expectFromPlainJs: true, gs: 'console.log((1234.5).toFixed(2).replace(".", ","));', sev: 'HIGH', classe: 'defeito' },
  { id: 'P08', grupo: 'js-puro', titulo: 'try/catch/finally com Error customizado', expectFromPlainJs: true, gs: 'class MeuErro extends Error {}\ntry { throw new MeuErro("x"); } catch (e) { console.log(e instanceof MeuErro, e.message); } finally { console.log("fim"); }', classe: 'controle' },
  { id: 'P09', grupo: 'js-puro', titulo: 'optional chaining e nullish', expectFromPlainJs: true, gs: 'const o = null;\nconsole.log(o?.x ?? "padrao", [1, 2]?.[1]);', classe: 'controle' },
  { id: 'P10', grupo: 'js-puro', titulo: '"use strict" do usuário é diretiva? (strict revela atribuição a variável não declarada)', expectFromPlainJs: true, gs: '"use strict";\ntry { naoDeclarada = 5; console.log("sloppy"); } catch (e) { console.log(e.name); }', sev: 'LOW', classe: 'defeito', nota: 'o runtime vem antes: a diretiva deixa de ser a primeira instrução do script' },
  { id: 'P11', grupo: 'js-puro', titulo: 'JSON, typeof e Date', expectFromPlainJs: true, gs: 'console.log(JSON.stringify({ a: [1, 2] }), typeof null, typeof undefined, new Date(0).toISOString());', classe: 'controle' },
  { id: 'P12', grupo: 'js-puro', titulo: 'arguments + Array.prototype.slice.call', expectFromPlainJs: true, gs: 'function f() { return Array.prototype.slice.call(arguments).length; }\nconsole.log(f(1, 2, 3));', classe: 'controle' },
  { id: 'P13', grupo: 'js-puro', titulo: 'array de objetos com sort(comparador) e find', expectFromPlainJs: true, gs: 'const xs = [{ n: 3 }, { n: 1 }];\nxs.sort((a, b) => a.n - b.n);\nconsole.log(xs[0].n, xs.find(x => x.n === 3).n);', classe: 'controle' },
  { id: 'P14', grupo: 'js-puro', titulo: 'string.padStart/repeat/replaceAll/at (APIs modernas)', expectFromPlainJs: true, gs: 'console.log("5".padStart(3, "0"), "ab".repeat(2), "a-b-c".replaceAll("-", "+"), [1, 2, 3].at(-1));', classe: 'controle' },

  // ---------- entradas degeneradas ----------
  { id: 'D01', grupo: 'entrada', titulo: 'entrada vazia ""', gs: '', check: r => ({ ok: r.transpiled && r.run.ok, detalhe: `transpiled=${r.transpiled} bytes_saida=${r.user !== null ? r.user.length : 'n/a'}` }), classe: 'controle', nota: 'a saída é só o runtime (≈5,4 KB) mesmo sem código' },
  { id: 'D02', grupo: 'entrada', titulo: 'só espaços e quebras de linha', gs: '   \n\n\t  ', check: r => ({ ok: r.transpiled && r.run.ok }), classe: 'controle' },
  { id: 'D03', grupo: 'entrada', titulo: 'só comentários', gs: '// nada aqui\n/* nem aqui */', check: r => ({ ok: r.transpiled && r.run.ok }), classe: 'controle' },
  {
    id: 'D04',
    grupo: 'entrada',
    titulo: 'transpile(undefined): erro claro, sem apontar para o código interno do compilador',
    custom: async () => {
      const result = h.transpile(undefined);
      const msg = result.error && result.error.message;
      const ok = !result.success && /texto|string|código|inválid/i.test(msg || '') && !/linha \d+, coluna/.test(msg || '');
      return { ok, entrada: 'transpile(undefined)', saida: `success=${result.success}`, exec: `mensagem=${msg}`, detalhe: `linha/coluna reportadas apontam para ${(result.error && result.error.arquivo) || '?'} mas são do JS interno do transpilador` };
    },
    sev: 'MEDIUM',
    classe: 'defeito',
  },
  {
    id: 'D05',
    grupo: 'entrada',
    titulo: 'transpile(123): mensagem coerente',
    custom: async () => {
      const result = h.transpile(123);
      const msg = result.error && result.error.message;
      const ok = !result.success && /texto|string|código|inválid/i.test(msg || '') && !/split/.test(msg || '');
      return { ok, entrada: 'transpile(123)', saida: `success=${result.success}`, exec: `mensagem=${msg}` };
    },
    sev: 'LOW',
    classe: 'defeito',
  },
  {
    id: 'D06',
    grupo: 'entrada',
    titulo: 'GoiasScriptCompiler.compile(null) não deve lançar e deve reportar erro',
    custom: async () => {
      const c = new h.GoiasScriptCompiler();
      let r;
      try {
        r = c.compile(null);
      } catch (error) {
        return { ok: false, entrada: 'compile(null)', saida: '', exec: `lançou ${error.message}` };
      }
      return { ok: r.success === false && r.errors.length > 0, entrada: 'compile(null)', saida: JSON.stringify({ success: r.success, errors: r.errors.map(e => e.message) }), exec: '' };
    },
    classe: 'controle',
  },
  {
    id: 'D07',
    grupo: 'entrada',
    titulo: 'validate() de código com SyntaxError de JS',
    custom: async () => {
      const c = new h.GoiasScriptCompiler();
      const r = c.validate('uai x é (;');
      return { ok: r.valid === false, entrada: 'validate("uai x é (;")', saida: `valid=${r.valid} errors=${r.errors.length}`, exec: '', detalhe: 'validate()/vê_se_tá_certo só roda 2 heurísticas por linha e nunca parseia o JS gerado' };
    },
    sev: 'HIGH',
    classe: 'defeito',
  },
];
