import { cpSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SOURCE_RELATIVE = join('node_modules', 'monaco-editor', 'min', 'vs');
const TARGET_RELATIVE = join('public', 'vs');

export function copyMonaco(appRoot: string): 'copied' | 'missing-source' {
  const source = join(appRoot, SOURCE_RELATIVE);
  if (!existsSync(source)) return 'missing-source';
  cpSync(source, join(appRoot, TARGET_RELATIVE), { recursive: true });
  return 'copied';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const outcome = copyMonaco(join(dirname(fileURLToPath(import.meta.url)), '..'));
  if (outcome === 'missing-source') {
    process.stderr.write('Ô sô, não achei o Monaco em node_modules. Roda "pnpm install" primeiro.\n');
    process.exit(1);
  }
}
