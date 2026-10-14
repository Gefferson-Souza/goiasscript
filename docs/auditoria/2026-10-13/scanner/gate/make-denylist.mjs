#!/usr/bin/env node
// Gera a lista de bloqueio de palavras portuguesas a partir de uma execução com dicionários.
// Uso: node gate/make-denylist.mjs [--scan scan-result.json] [--out gate/pt-denylist.json]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCANNER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const argValue = (flag, fallback) => (args.includes(flag) ? path.resolve(args[args.indexOf(flag) + 1]) : fallback);
const scan = JSON.parse(fs.readFileSync(argValue('--scan', path.join(SCANNER_DIR, 'scan-result.json')), 'utf8'));
const outPath = argValue('--out', path.join(SCANNER_DIR, 'gate', 'pt-denylist.json'));

const normalize = (word) => word.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
const words = new Set();
for (const file of scan.files) {
  for (const item of file.identifiers.items) {
    if (item.surface === 'surface-exact' || item.tier === 'domain') continue;
    for (const token of item.ptTokens) words.add(normalize(token));
  }
}
const sorted = [...words].filter((word) => word.length >= 3).sort();
fs.writeFileSync(outPath, `${JSON.stringify({ geradoDe: scan.meta.git?.head ?? null, words: sorted }, null, 1)}\n`);
process.stdout.write(`${sorted.length} palavras em ${outPath}\n`);
