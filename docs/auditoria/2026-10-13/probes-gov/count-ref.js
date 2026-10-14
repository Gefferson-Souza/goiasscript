'use strict';
// Conta linhas de texto por pasta/extensão para uma ref git, sem checkout (git ls-tree + git cat-file --batch).
const { execFileSync, spawnSync } = require('child_process');
const path = require('path');

const repo = '<repo>';
const ref = process.argv[2];
if (!ref) {
  console.error('uso: node count-ref.js <ref>');
  process.exit(1);
}

const listing = execFileSync('git', ['-C', repo, 'ls-tree', '-r', '-l', '-z', ref], { maxBuffer: 1 << 28 }).toString('utf8');
const entries = listing
  .split('\0')
  .filter(Boolean)
  .map(line => {
    const tab = line.indexOf('\t');
    const meta = line.slice(0, tab).trim().split(/\s+/);
    return { mode: meta[0], type: meta[1], sha: meta[2], size: Number(meta[3]) || 0, file: line.slice(tab + 1) };
  })
  .filter(e => e.type === 'blob');

const BINARY_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.vsix', '.woff', '.woff2', '.ttf', '.zip', '.gz', '.tgz', '.pdf', '.wasm']);
const ignoredFragments = ['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', 'Cargo.lock'];

const batchInput = entries.map(e => e.sha).join('\n') + '\n';
const batch = spawnSync('git', ['-C', repo, 'cat-file', '--batch'], { input: batchInput, maxBuffer: 1 << 30 });
const out = batch.stdout;
let offset = 0;
const contents = new Map();
for (const e of entries) {
  const nl = out.indexOf(0x0a, offset);
  const header = out.slice(offset, nl).toString('utf8').split(' ');
  const size = Number(header[2]);
  const body = out.slice(nl + 1, nl + 1 + size);
  offset = nl + 1 + size + 1;
  contents.set(e.sha, body);
}

const byTop = {};
const byExt = {};
const rows = [];
let totalLines = 0;
let totalFiles = 0;
let binaryFiles = 0;
let binaryBytes = 0;
let lockLines = 0;
for (const e of entries) {
  const ext = path.extname(e.file).toLowerCase() || '(sem ext)';
  const body = contents.get(e.sha);
  const isBinary = BINARY_EXT.has(ext) || body.includes(0);
  if (isBinary) {
    binaryFiles++;
    binaryBytes += e.size;
    continue;
  }
  const text = body.toString('utf8');
  const lines = text.length === 0 ? 0 : text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
  if (ignoredFragments.some(f => e.file.endsWith(f))) {
    lockLines += lines;
    continue;
  }
  totalLines += lines;
  totalFiles++;
  const top = e.file.includes('/') ? e.file.split('/')[0] : '(raiz)';
  byTop[top] = byTop[top] || { files: 0, lines: 0 };
  byTop[top].files++;
  byTop[top].lines += lines;
  byExt[ext] = byExt[ext] || { files: 0, lines: 0 };
  byExt[ext].files++;
  byExt[ext].lines += lines;
  rows.push({ file: e.file, lines });
}

console.log(`REF ${ref}: arquivos-texto=${totalFiles} linhas=${totalLines} (excluindo lockfiles: ${lockLines} linhas) | binários=${binaryFiles} (${(binaryBytes / 1048576).toFixed(1)} MiB)`);
console.log('--- por pasta de 1o nível ---');
for (const [k, v] of Object.entries(byTop).sort((a, b) => b[1].lines - a[1].lines)) console.log(`  ${k.padEnd(28)} arquivos=${String(v.files).padStart(4)} linhas=${String(v.lines).padStart(7)}`);
console.log('--- por extensão ---');
for (const [k, v] of Object.entries(byExt).sort((a, b) => b[1].lines - a[1].lines).slice(0, 12)) console.log(`  ${k.padEnd(12)} arquivos=${String(v.files).padStart(4)} linhas=${String(v.lines).padStart(7)}`);
if (process.argv[3] === '--top') {
  console.log('--- 40 maiores arquivos ---');
  for (const r of rows.sort((a, b) => b.lines - a.lines).slice(0, 40)) console.log(`  ${String(r.lines).padStart(6)}  ${r.file}`);
}
