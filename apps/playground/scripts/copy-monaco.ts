import { copyFileSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDITOR_WORKER_FILE, EDITOR_WORKER_SOURCE } from '../lib/monaco/monaco-assets.ts';

const SOURCE_RELATIVE = join('node_modules', 'monaco-editor', 'min', 'vs');
const TARGET_RELATIVE = join('public', 'vs');

const findEditorWorker = (source: string): string | undefined => {
  const assets = join(source, 'assets');
  if (!existsSync(assets)) return undefined;
  return readdirSync(assets).find((name) => EDITOR_WORKER_SOURCE.test(name));
};

export function copyMonaco(appRoot: string): 'copied' | 'missing-source' | 'missing-worker' {
  const source = join(appRoot, SOURCE_RELATIVE);
  if (!existsSync(source)) return 'missing-source';
  const worker = findEditorWorker(source);
  if (worker === undefined) return 'missing-worker';
  const target = join(appRoot, TARGET_RELATIVE);
  cpSync(source, target, { recursive: true });
  copyFileSync(join(source, 'assets', worker), join(target, EDITOR_WORKER_FILE));
  return 'copied';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outcome = copyMonaco(join(dirname(fileURLToPath(import.meta.url)), '..'));
  if (outcome === 'missing-source') {
    process.stderr.write('Ô sô, não achei o Monaco em node_modules. Roda "pnpm install" primeiro.\n');
    process.exit(1);
  }
  if (outcome === 'missing-worker') {
    process.stderr.write('Ô sô, o Monaco veio sem o worker do editor (assets/editor.worker-*.js). Confere a versão do monaco-editor.\n');
    process.exit(1);
  }
}
