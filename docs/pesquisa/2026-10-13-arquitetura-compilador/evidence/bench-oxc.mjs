// Uso: node bench-oxc.mjs <pasta-com-package.json-e-node_modules> <arquivo.js>...
// A pasta de dependências precisa de: acorn@8.19.0, meriyah@6.1.4, @babel/parser@7.29.9,
// oxc-parser@0.154.0 e typescript@5.9.3 (versões usadas na pesquisa de 2026-10-13).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const depsRoot = process.argv[2];
const inputs = process.argv.slice(3);
const require = createRequire(`${depsRoot}/package.json`);

const meriyah = require('meriyah');
const oxc = require('oxc-parser');

const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];

const measure = (fn, runs) => {
  fn();
  fn();
  const samples = [];
  for (let i = 0; i < runs; i++) {
    const start = performance.now();
    fn();
    samples.push(performance.now() - start);
  }
  return median(samples);
};

console.log(`rawTransferSupported = ${oxc.rawTransferSupported()}`);

for (const file of inputs) {
  const source = readFileSync(file, 'utf8');
  const megabytes = Buffer.byteLength(source) / 1e6;
  const runs = megabytes > 3 ? 7 : 20;
  const candidates = [
    ['meriyah (JS, full AST)', () => meriyah.parseScript(source, { next: true })],
    ['oxc default (JSON path, program materialized)', () => oxc.parseSync('input.js', source, { sourceType: 'script' }).program],
    ['oxc default, program NOT accessed', () => oxc.parseSync('input.js', source, { sourceType: 'script' })],
    ['oxc experimentalRawTransfer (program materialized)', () => oxc.parseSync('input.js', source, { sourceType: 'script', experimentalRawTransfer: true }).program],
    ['oxc experimentalLazy (lazy wrapper, nothing materialized)', () => oxc.parseSync('input.js', source, { sourceType: 'script', experimentalLazy: true })],
  ];
  console.log(`\n== ${file.split('/').pop()} (${megabytes.toFixed(2)} MB, ${runs} runs) ==`);
  for (const [name, fn] of candidates) {
    try {
      const med = measure(fn, runs);
      console.log(`${name.padEnd(62)} median ${med.toFixed(1).padStart(8)} ms`);
    } catch (error) {
      console.log(`${name.padEnd(62)} FAILED: ${String(error.message).slice(0, 140)}`);
    }
  }
}
