import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readmeBannerSvg } from '../lib/brand-card/readme-banner.ts';

const BANNER_SEGMENTS = ['..', '..', '.github', 'assets', 'banner.svg'] as const;
const CHECK_FLAG = '--check';
const FONT_FILES = {
  sansBold: 'space-grotesk-latin-700-normal.woff2',
  monoRegular: 'jetbrains-mono-latin-400-normal.woff2',
  monoBold: 'jetbrains-mono-latin-700-normal.woff2',
} as const;

function bannerFor(appRoot: string): string {
  const base64 = (file: string): string => readFileSync(join(appRoot, 'app', 'fonts', file)).toString('base64');
  return readmeBannerSvg({ sansBold: base64(FONT_FILES.sansBold), monoRegular: base64(FONT_FILES.monoRegular), monoBold: base64(FONT_FILES.monoBold) });
}

// O banner é gerado da linha da vitrine; o --check impede que o arquivo do README fique pra trás.
export function buildReadmeBanner(appRoot: string, check: boolean): 'written' | 'fresh' | 'stale' {
  const target = join(appRoot, ...BANNER_SEGMENTS);
  const svg = bannerFor(appRoot);
  if (check) return existsSync(target) && readFileSync(target, 'utf8') === svg ? 'fresh' : 'stale';
  writeFileSync(target, svg);
  return 'written';
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = buildReadmeBanner(join(dirname(fileURLToPath(import.meta.url)), '..'), process.argv.includes(CHECK_FLAG));
  if (result === 'stale') {
    process.stderr.write('Ô rapaz! O banner do README ficou pra trás. Rode "pnpm --filter playground build:readme-banner".\n');
    process.exit(1);
  }
}
