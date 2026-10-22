import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, type Plugin } from 'esbuild';
import type { BuildCliOptions } from './build-cli.types.ts';
import { buildDeclarations } from './cli-declarations.ts';

const ROOT = path.join(import.meta.dirname, '..');
const NODE_TARGET = 'node22';
const BIN_MODE = 0o755;
const BINARIES = ['goiasscript.mjs', 'goias.mjs'] as const;
const SHEBANG = '#!/usr/bin/env node\n';
const BUNDLER_PATH_COMMENT = /^\/\/ \S+\.(?:ts|mjs|js|json)\r?\n/gmu;

const CLI_MANIFEST = /packages[\\/]cli[\\/]package\.json$/;

// Só a versão do manifesto entra no pacote; dependências do workspace ficam de fora.
const slimManifestPlugin: Plugin = {
  name: 'slim-manifest',
  setup(pluginBuild) {
    pluginBuild.onLoad({ filter: CLI_MANIFEST }, (args) => {
      const { version } = JSON.parse(fs.readFileSync(args.path, 'utf8')) as { readonly version: string };
      return { contents: JSON.stringify({ version }), loader: 'json' };
    });
  },
};

const ENTRY_POINTS: Readonly<Record<string, string>> = {
  goiasscript: 'packages/cli/src/entry/goiasscript.ts',
  goias: 'packages/cli/src/entry/goias.ts',
  index: 'packages/cli/src/entry/api.ts',
  optimizer: 'packages/optimizer/src/index.ts',
};

function listJavaScript(directory: string): readonly string[] {
  return fs
    .readdirSync(directory, { recursive: true, encoding: 'utf8' })
    .filter((name) => name.endsWith('.mjs'))
    .map((name) => path.join(directory, name));
}

function finalizeFiles(outDir: string): void {
  listJavaScript(outDir).forEach((file) => {
    const cleaned = fs.readFileSync(file, 'utf8').replace(BUNDLER_PATH_COMMENT, '');
    const isBinary = BINARIES.some((name) => path.basename(file) === name && path.dirname(file) === outDir);
    fs.writeFileSync(file, isBinary ? `${SHEBANG}${cleaned}` : cleaned);
    if (isBinary) fs.chmodSync(file, BIN_MODE);
  });
}

export async function buildCli(options: BuildCliOptions): Promise<void> {
  const outDir = path.resolve(options.outDir);
  fs.rmSync(outDir, { recursive: true, force: true });
  await build({
    absWorkingDir: ROOT,
    entryPoints: ENTRY_POINTS,
    outdir: outDir,
    outExtension: { '.js': '.mjs' },
    chunkNames: 'chunks/[name]-[hash]',
    plugins: [slimManifestPlugin],
    bundle: true,
    splitting: true,
    platform: 'node',
    format: 'esm',
    target: NODE_TARGET,
    minify: false,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'warning',
  });
  finalizeFiles(outDir);
  fs.writeFileSync(path.join(outDir, 'index.d.ts'), buildDeclarations());
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildCli({ outDir: path.join(ROOT, 'packages/cli/dist') });
}
