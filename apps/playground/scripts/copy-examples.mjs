#!/usr/bin/env node
// Copia os exemplos .gs do packages/core para o public/ do playground.
// Roda antes de `next dev` e `next build` (prescript no package.json).
import { mkdir, readdir, copyFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, '..', '..', '..', 'packages', 'core', 'examples', 'basic');
const DEST = join(__dirname, '..', 'public', 'examples');

async function main() {
  if (!existsSync(SRC)) {
    console.warn(`[copy-examples] Origem não existe: ${SRC}`);
    return;
  }
  await mkdir(DEST, { recursive: true });
  const files = (await readdir(SRC)).filter(f => f.endsWith('.gs'));
  const manifest = [];
  for (const f of files) {
    const fromPath = join(SRC, f);
    const stats = await stat(fromPath);
    if (!stats.isFile()) continue;
    await copyFile(fromPath, join(DEST, f));
    manifest.push({ nome: basename(f, '.gs'), arquivo: f });
  }
  await writeFile(join(DEST, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[copy-examples] ${files.length} exemplo(s) copiado(s) para ${DEST}`);
}

main().catch(err => {
  console.error('[copy-examples] erro:', err);
  process.exit(1);
});
