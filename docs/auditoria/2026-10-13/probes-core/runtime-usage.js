'use strict';
// Quantos símbolos do runtime injetado o CÓDIGO GERADO do usuário realmente referencia?
const fs = require('fs');
const { execFileSync } = require('child_process');
const { transpile, userPart, RUNTIME } = require('./harness');
const REPO = '<repo>';

const symbols = new Set();
for (const m of RUNTIME.matchAll(/(?:String|Array|Object|Date)\.prototype\.(\w+)\s*=|(?:^|\n)Object\.(\w+)\s*=|(?:^|\n)function (\w+)\(|GoianoMath\.(\w+)\s*=|globalThis\.(\w+)\s*=/g)) {
  symbols.add(m[1] || m[2] || m[3] || m[4] || m[5]);
}
symbols.add('GoianoMath');
console.log(`símbolos definidos pelo runtime: ${symbols.size}`);

function used(js) {
  return [...symbols].filter(s => new RegExp(`(^|[^\\w$])${s}(?![\\w$])`).test(js));
}
const programs = [];
for (const rel of ['packages/core/examples/basic/ola-mundo.gs', 'packages/core/examples/basic/lista-mapeamento.gs', 'packages/core/examples/classes/pequi.gs', 'packages/core/examples/basic/exemplo.gs', 'packages/core/templates/basic-template.gs', 'packages/core/examples/advanced/teste_erros.gs']) {
  programs.push([rel.split('/').slice(-2).join('/'), fs.readFileSync(`${REPO}/${rel}`, 'utf8')]);
}
programs.push(['README main.gs (quick start)', ['uai nome é "Goiás"', 'uai numeros é [1, 2, 3, 4, 5]', 'prosa("Bem-vindo ao", nome)', 'uai dobrados é numeros.mapear(x => x vezes 2)', 'prosa("Dobrados:", dobrados)', 'faz_trem saudar(pessoa) {', '  faz_favor "Eai " mais pessoa mais ", tudo beleza?"', '}', 'prosa(saudar(nome))'].join('\n')]);
for (const [name, src] of programs) {
  const t = transpile(src);
  const u = userPart(t.code);
  const list = used(u);
  console.log(`${name.padEnd(42)} entrada=${String(src.length).padStart(5)} B | runtime=${RUNTIME.length} B | símbolos usados=${list.length}${list.length ? ' (' + list.join(', ') + ')' : ''}`);
}
