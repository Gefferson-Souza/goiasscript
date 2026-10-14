import fs from 'node:fs';
import path from 'node:path';

const SCOPE = [
  { pkg: 'core', root: 'packages/core', dirs: ['src', 'bin', 'tests'], exts: ['.js'] },
  { pkg: 'playground', root: 'apps/playground', dirs: ['.'], exts: ['.ts', '.tsx', '.mjs'] },
  { pkg: 'engoianador-api', root: 'apps/engoianador-api', dirs: ['src', 'test'], exts: ['.ts'] },
  { pkg: 'playground-e2e', root: 'apps/playground-e2e', dirs: ['tests'], exts: ['.ts'] },
  { pkg: 'vscode-extension', root: 'vscode-extension', dirs: ['src'], exts: ['.js'] },
];

const EXCLUDED_SEGMENTS = new Set([
  'node_modules', '.next', 'coverage', 'dist', 'out', 'build', '.turbo', '.vercel', '.wrangler',
]);
const EXCLUDED_PREFIXES = ['apps/playground/public/vs/', 'apps/playground/public/examples/'];
const GENERATED_FILES = new Set(['apps/playground/next-env.d.ts']);
const CONFIG_FILE_PATTERN = /(^|\/)(next|postcss|tailwind|vite|vitest|jest|playwright)\.config\.(m?[jt]s)$/;

function isExcludedPath(rel) {
  if (EXCLUDED_PREFIXES.some((prefix) => rel.startsWith(prefix))) return true;
  if (/\.min\.[cm]?js$/.test(rel)) return true;
  return rel.split('/').some((segment) => EXCLUDED_SEGMENTS.has(segment));
}

function* walk(absDir) {
  if (!fs.existsSync(absDir)) return;
  for (const entry of fs.readdirSync(absDir, { withFileTypes: true })) {
    const abs = path.join(absDir, entry.name);
    if (entry.isDirectory()) yield* walk(abs);
    else if (entry.isFile()) yield abs;
  }
}

export function classifyRole(rel) {
  if (/(^|\/)(tests?|__tests__|playground-e2e)\//.test(rel) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(rel)) {
    return 'test';
  }
  if (rel.endsWith('.d.ts')) return 'declaration';
  if (CONFIG_FILE_PATTERN.test(rel)) return 'config';
  if (/(^|\/)scripts\//.test(rel)) return 'script';
  if (/^packages\/core\/bin\//.test(rel)) return 'bin';
  if (/^packages\/core\/src\/cli\//.test(rel)) return 'cli';
  return 'src';
}

export function discoverFiles(repoRoot) {
  const included = [];
  const excluded = [];
  for (const scope of SCOPE) {
    for (const dir of scope.dirs) {
      const absDir = path.join(repoRoot, scope.root, dir);
      for (const abs of walk(absDir)) {
        const rel = path.relative(repoRoot, abs).split(path.sep).join('/');
        if (!scope.exts.includes(path.extname(rel))) continue;
        if (GENERATED_FILES.has(rel)) {
          excluded.push({ rel, reason: 'arquivo gerado pelo Next.js' });
        } else if (isExcludedPath(rel)) {
          excluded.push({ rel, reason: 'diretório/arquivo fora do escopo' });
        } else {
          included.push({ rel, abs, pkg: scope.pkg, role: classifyRole(rel), ext: path.extname(rel) });
        }
      }
    }
  }
  included.sort((a, b) => a.rel.localeCompare(b.rel));
  excluded.sort((a, b) => a.rel.localeCompare(b.rel));
  return { included, excluded };
}
