// Uso: node bench.mjs <pasta-com-package.json-e-node_modules> <arquivo.js>...
// A pasta de dependências precisa de: acorn@8.19.0, meriyah@6.1.4, @babel/parser@7.29.9,
// oxc-parser@0.154.0 e typescript@5.9.3 (versões usadas na pesquisa de 2026-10-13).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import os from 'node:os';

const depsRoot = process.argv[2];
const inputs = process.argv.slice(3);
const require = createRequire(`${depsRoot}/package.json`);

const acorn = require('acorn');
const meriyah = require('meriyah');
const babel = require('@babel/parser');
const oxc = require('oxc-parser');

const packageVersion = (name) => JSON.parse(readFileSync(`${depsRoot}/node_modules/${name}/package.json`, 'utf8')).version;

const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
};

const measure = (fn, runs) => {
  fn();
  fn();
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  return { median: median(samples), min: Math.min(...samples) };
};

console.log(`node ${process.version} | ${os.cpus()[0].model} | ${os.cpus().length} cpus`);

for (const file of inputs) {
  const source = readFileSync(file, 'utf8');
  const megabytes = Buffer.byteLength(source) / 1e6;
  const runs = megabytes > 3 ? 7 : 20;
  const candidates = [
    ['acorn ' + acorn.version, () => acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'script', allowHashBang: true })],
    ['meriyah ' + packageVersion('meriyah'), () => meriyah.parseScript(source, { next: true })],
    ['@babel/parser ' + packageVersion('@babel/parser'), () => babel.parse(source, { sourceType: 'script' })],
    ['oxc-parser ' + packageVersion('oxc-parser') + ' (napi, program materialized)', () => {
      const result = oxc.parseSync('input.js', source, { sourceType: 'script' });
      return result.program;
    }],
  ];
  console.log(`\n== ${file.split('/').pop()} (${megabytes.toFixed(2)} MB, ${runs} runs) ==`);
  for (const [name, fn] of candidates) {
    try {
      const { median: med, min } = measure(fn, runs);
      console.log(`${name.padEnd(62)} median ${med.toFixed(1).padStart(8)} ms | min ${min.toFixed(1).padStart(8)} ms | ${(megabytes / (med / 1000)).toFixed(1).padStart(6)} MB/s`);
    } catch (error) {
      console.log(`${name.padEnd(62)} FAILED: ${String(error.message).slice(0, 120)}`);
    }
  }
}
