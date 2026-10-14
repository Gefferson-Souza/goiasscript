import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCANNER_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Prefere o node_modules do próprio scanner; cai para o store pnpm do repo auditado.
function buildRequires(repoRoot) {
  return [
    createRequire(path.join(SCANNER_DIR, 'noop.js')),
    createRequire(path.join(repoRoot, 'node_modules', '.pnpm', 'noop.js')),
  ];
}

function requireFirst(requires, specifier) {
  const failures = [];
  for (const candidate of requires) {
    try {
      return candidate(specifier);
    } catch (error) {
      failures.push(error.message.split('\n')[0]);
    }
  }
  throw new Error(`Dependência indisponível: ${specifier} (${failures.join(' | ')})`);
}

function versionOf(requires, specifier) {
  try {
    return requireFirst(requires, `${specifier}/package.json`).version;
  } catch {
    return 'desconhecida';
  }
}

export function loadDeps(repoRoot) {
  const requires = buildRequires(repoRoot);
  const get = (specifier) => requireFirst(requires, specifier);
  const babelTraverse = get('@babel/traverse');
  return {
    parser: get('@babel/parser'),
    traverse: babelTraverse.default ?? babelTraverse,
    types: get('@babel/types'),
    versions: {
      babelParser: versionOf(requires, '@babel/parser'),
      babelTraverse: versionOf(requires, '@babel/traverse'),
      babelTypes: versionOf(requires, '@babel/types'),
    },
    resolveOptional: (specifier) => {
      try {
        return get(specifier);
      } catch {
        return null;
      }
    },
  };
}
