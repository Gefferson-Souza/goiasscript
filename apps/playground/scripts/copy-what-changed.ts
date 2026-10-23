import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WHAT_CHANGED_COPY_SEGMENTS, WHAT_CHANGED_SPEC_SEGMENTS } from '../lib/cartilha/what-changed.constants.ts';

// Quando o build roda sem o docs/spec ao lado, a página lê esta cópia local.
export function copyWhatChanged(appRoot: string): 'copied' | 'missing-source' {
  const source = join(appRoot, ...WHAT_CHANGED_SPEC_SEGMENTS);
  if (!existsSync(source)) return 'missing-source';
  const target = join(appRoot, ...WHAT_CHANGED_COPY_SEGMENTS);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(source, target);
  return 'copied';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  copyWhatChanged(join(dirname(fileURLToPath(import.meta.url)), '..'));
}
