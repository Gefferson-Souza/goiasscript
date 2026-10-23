import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants } from 'node:zlib';
import { build } from 'esbuild';
import { buildCli } from './build-cli.ts';
import type { BuildVscodeOptions, BuildVscodeResult } from './build-vscode.types.ts';
import { copyGeneratedAssets, findStaleGeneratedAssets } from './vscode-generated-assets.ts';

const ROOT = path.join(import.meta.dirname, '..');
const VSCODE_DIR = path.join(ROOT, 'packages/vscode');
const BUDGETS_FILE = path.join(VSCODE_DIR, 'budgets.json');
// O VS Code 1.90 embute o Node 20; o bundle não pode exigir sintaxe mais nova.
const NODE_TARGET = 'node20';
const BUNDLER_PATH_COMMENT = /^\/\/ \S+\.(?:ts|mjs|js|cjs|json)\r?\n/gmu;
const BUNDLE_NAME = 'extension.cjs';
const CLI_DECLARATIONS = 'index.d.ts';
const CHECK_FLAG = '--check-assets';

function measureBrotliBytes(file: string): number {
  return brotliCompressSync(fs.readFileSync(file), { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY } }).byteLength;
}

export async function buildVscode(options: BuildVscodeOptions): Promise<BuildVscodeResult> {
  const outDir = path.resolve(options.outDir);
  copyGeneratedAssets();
  fs.rmSync(outDir, { recursive: true, force: true });
  await build({
    absWorkingDir: ROOT,
    entryPoints: { extension: 'packages/vscode/src/extension.ts' },
    outdir: outDir,
    outExtension: { '.js': '.cjs' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: NODE_TARGET,
    external: ['vscode'],
    minify: false,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'warning',
  });
  const bundle = path.join(outDir, BUNDLE_NAME);
  fs.writeFileSync(bundle, fs.readFileSync(bundle, 'utf8').replace(BUNDLER_PATH_COMMENT, ''));
  const cliDir = path.join(outDir, 'cli');
  await buildCli({ outDir: cliDir });
  // A extensão só executa o CLI; as declarações da API não têm uso no pacote.
  fs.rmSync(path.join(cliDir, CLI_DECLARATIONS), { force: true });
  return { extensionBrotliBytes: measureBrotliBytes(bundle) };
}

function checkAssets(): number {
  const stale = findStaleGeneratedAssets();
  if (stale.length === 0) return 0;
  process.stderr.write(`Ô rapaz! Estes arquivos divergiram do gerado: ${stale.join(', ')}. Rode "corepack pnpm build:vscode".\n`);
  return 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes(CHECK_FLAG)) {
    process.exit(checkAssets());
  } else {
    const { extensionBrotliBytes } = await buildVscode({ outDir: path.join(VSCODE_DIR, 'dist') });
    const budget = (JSON.parse(fs.readFileSync(BUDGETS_FILE, 'utf8')) as { readonly extensionBundleBrotliBytes: number }).extensionBundleBrotliBytes;
    process.stdout.write(`${BUNDLE_NAME}: ${String(extensionBrotliBytes)} B brotli (registrado: ${String(budget)} B)\n`);
  }
}
