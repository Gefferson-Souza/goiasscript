#!/usr/bin/env node
// Copia os exemplos .gs curados do packages/core para o public/ do playground
// e gera um manifest com nomes amigáveis. Roda antes de `next dev`/`next build`.
import { mkdir, copyFile, writeFile, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORE = join(__dirname, '..', '..', '..', 'packages', 'core', 'examples');
const DEST = join(__dirname, '..', 'public', 'examples');
const PUBLIC = join(__dirname, '..', 'public');

// Self-host do Monaco: copia min/vs pra public/vs pra carregar same-origin
// (a CSP do site bloqueia CDN externo). Roda só se ainda não existir.
async function copyMonaco() {
  const require = createRequire(import.meta.url);
  const monacoPkg = require.resolve('monaco-editor/package.json');
  const vsSrc = join(dirname(monacoPkg), 'min', 'vs');
  const vsDest = join(PUBLIC, 'vs');
  if (existsSync(vsDest)) return;
  if (!existsSync(vsSrc)) {
    console.warn(`[copy-examples] monaco min/vs não encontrado: ${vsSrc}`);
    return;
  }
  await cp(vsSrc, vsDest, { recursive: true });
  console.log(`[copy-examples] Monaco copiado → ${vsDest}`);
}

// Lista curada: ordem e nomes amigáveis exibidos no playground.
const CURATED = [
  { nome: 'Olá Mundo', src: 'basic/ola-mundo.gs', arquivo: 'ola-mundo.gs' },
  { nome: 'Lista e mapeamento', src: 'basic/lista-mapeamento.gs', arquivo: 'lista-mapeamento.gs' },
  { nome: 'Classe Pequi', src: 'classes/pequi.gs', arquivo: 'pequi.gs' },
];

async function main() {
  await mkdir(DEST, { recursive: true });
  const manifest = [];
  for (const ex of CURATED) {
    const from = join(CORE, ex.src);
    if (!existsSync(from)) {
      console.warn(`[copy-examples] faltando: ${from}`);
      continue;
    }
    await copyFile(from, join(DEST, ex.arquivo));
    manifest.push({ nome: ex.nome, arquivo: ex.arquivo });
  }
  await writeFile(join(DEST, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[copy-examples] ${manifest.length} exemplo(s) curado(s) → ${DEST}`);
  await copyMonaco();
}

main().catch((err) => {
  console.error('[copy-examples] erro:', err);
  process.exit(1);
});
