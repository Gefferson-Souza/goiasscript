import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const TEST_DIR = /(^|\/)(tests?|__tests__)\//;
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const CHECKED_ROOTS = ['packages', 'tools', 'scripts'];
const EXAMPLE_EXTENSION = '.gs';
export const DECLARATION_FILE = /\.d\.[cm]?ts$/;

export const loadScope = (root) => JSON.parse(fs.readFileSync(path.join(root, 'tools/rules-scan/scope.json'), 'utf8'));
export const listTrackedFiles = (root) => execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
export const isInside = (rel, prefix) => rel === prefix || rel.startsWith(prefix.endsWith('/') ? prefix : `${prefix}/`);

function classifyRole(rel) {
  if (TEST_DIR.test(rel) || TEST_FILE.test(rel)) return 'test';
  if (DECLARATION_FILE.test(rel)) return 'declaration';
  return rel.startsWith('scripts/') ? 'script' : 'src';
}

const matchRoot = (rel, roots) => roots.find((entry) => (entry.files ?? []).includes(rel) || (entry.dirs ?? []).some((dir) => isInside(rel, path.posix.join(entry.path, dir))));

export function discoverFiles(root, scope, files = listTrackedFiles(root)) {
  const included = [];
  const excluded = [];
  const unscoped = [];
  for (const rel of files) {
    const ext = path.extname(rel);
    if (!scope.extensions.includes(ext)) continue;
    if (scope.excluded.some((entry) => isInside(rel, entry.path))) excluded.push(rel);
    else if (scope.ignoredPrefixes.some((prefix) => isInside(rel, prefix)) || rel.split('/').some((segment) => scope.ignoredSegments.includes(segment))) continue;
    else {
      const entry = matchRoot(rel, scope.roots);
      if (entry) included.push({ rel, abs: path.join(root, rel), pkg: entry.pkg, role: classifyRole(rel), ext });
      else if (['.ts', '.mts', '.tsx'].includes(ext)) unscoped.push(rel);
    }
  }
  return { included, excluded, unscoped };
}

export function scopeProblems(discovery) {
  const problems = discovery.unscoped.map((rel) => `arquivo rastreado fora do escopo e da lista excluded: ${rel}`);
  return discovery.included.length === 0 ? [...problems, 'o scanner analisou 0 arquivos'] : problems;
}

// Pasta e arquivo seguem o mesmo critério de idioma dos identificadores (ADR-0007).
export function pathSegmentFindings(files, scope, lexicon) {
  const findings = [];
  for (const rel of files) {
    if (!CHECKED_ROOTS.includes(rel.split('/')[0] ?? '') || path.extname(rel) === EXAMPLE_EXTENSION) continue;
    if (scope.excluded.some((entry) => isInside(rel, entry.path)) || scope.pathSegmentsExemptPrefixes.some((prefix) => isInside(rel, prefix))) continue;
    for (const segment of rel.split('/')) {
      const tier = lexicon.analyzeName(path.basename(segment, path.extname(segment))).tier;
      if (tier === 'strong' || tier === 'weak') findings.push({ file: rel, line: 1, text: `segmento de caminho em português: ${segment}` });
    }
  }
  return findings;
}
