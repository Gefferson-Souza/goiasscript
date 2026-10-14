'use strict';
// Para cada .gs versionado que falha: acha a linha do .gs que gera o SyntaxError e as keywords desconhecidas.
// Também demonstra que o erro NÃO traz a linha do .gs: usa o offset de 247 linhas do runtime.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { execFileSync } = require('child_process');
const { transpile, RUNTIME_PREFIX_LENGTH, show } = require('./harness');

const REPO = '<repo>';
const OFFSET = 247; // linhas ocupadas pelo runtime antes da 1ª linha do usuário (medido)

const files = execFileSync('git', ['-C', REPO, 'ls-files', '*.gs'], { encoding: 'utf8' }).split('\n').filter(Boolean);

for (const rel of files) {
  const source = fs.readFileSync(path.join(REPO, rel), 'utf8');
  const t = transpile(source);
  if (!t.success) {
    console.log(`${rel}: transpile falhou -> ${t.error.message}`);
    continue;
  }
  try {
    new vm.Script(t.code, { filename: 'gerado.js' });
    console.log(`${rel}: sintaxe JS ok`);
  } catch (error) {
    const match = /gerado\.js:(\d+)/.exec(error.stack || '');
    const jsLine = match ? Number(match[1]) : null;
    const gsLine = jsLine ? jsLine - OFFSET : null;
    const gsText = gsLine ? source.split('\n')[gsLine - 1] : '?';
    console.log(`${rel}: SyntaxError "${error.message}"`);
    console.log(`    linha no JS gerado: ${jsLine} -> linha no .gs (jsLine-${OFFSET}): ${gsLine}`);
    console.log(`    trecho do .gs : ${show((gsText || '').trim(), 140)}`);
  }
}
