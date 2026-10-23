import fs from 'node:fs';
import path from 'node:path';
import { COMPILER_ALLOWED_DEPENDENCY, COMPILER_PACKAGE_DIR, IMPORT_SPECIFIER, LANGUAGE_PACKAGE_DIR, SOURCE_FILE, WORKSPACE_PROTOCOL } from './gate.constants.ts';
import type { CompilerPackages, GateProblem, PackageManifest } from './gate.types.ts';

const MANIFEST_FILE = 'package.json';
const RELATIVE_PREFIX = '.';

function declared(manifest: PackageManifest): readonly (readonly [string, string])[] {
  return [manifest.dependencies, manifest.optionalDependencies, manifest.peerDependencies].flatMap((group) => Object.entries(group ?? {}));
}

function manifestProblems(manifest: PackageManifest): readonly GateProblem[] {
  const mayUseLanguage = manifest.name !== COMPILER_ALLOWED_DEPENDENCY;
  return declared(manifest)
    .filter(([name, range]) => !(mayUseLanguage && name === COMPILER_ALLOWED_DEPENDENCY && range.startsWith(WORKSPACE_PROTOCOL)))
    .map(([name]) => ({ file: `${manifest.name}/package.json`, message: `dependência de runtime "${name}" não é permitida.` }));
}

function importedPackages(text: string): readonly string[] {
  return [...text.matchAll(IMPORT_SPECIFIER)].map((match) => match[1] ?? match[2] ?? '').filter((specifier) => specifier !== '' && !specifier.startsWith(RELATIVE_PREFIX));
}

function sourceProblems(sources: Readonly<Record<string, string>>): readonly GateProblem[] {
  return Object.entries(sources).flatMap(([file, text]) =>
    importedPackages(text)
      .filter((specifier) => specifier !== COMPILER_ALLOWED_DEPENDENCY)
      .map((specifier) => ({ file, message: `importa "${specifier}", que não é o workspace da linguagem.` })),
  );
}

export function checkCompilerDependencies(manifests: readonly PackageManifest[], sources: Readonly<Record<string, string>>): readonly GateProblem[] {
  return [...manifests.flatMap(manifestProblems), ...sourceProblems(sources)];
}

function listSources(root: string, relative: string): readonly string[] {
  return fs.readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) return listSources(root, child);
    return SOURCE_FILE.test(entry.name) ? [child] : [];
  });
}

export function loadCompilerPackages(root: string): CompilerPackages {
  const manifest = (dir: string): PackageManifest => JSON.parse(fs.readFileSync(path.join(root, dir, MANIFEST_FILE), 'utf8')) as PackageManifest;
  const files = listSources(root, `${COMPILER_PACKAGE_DIR}/src`);
  return {
    manifests: [manifest(COMPILER_PACKAGE_DIR), manifest(LANGUAGE_PACKAGE_DIR)],
    sources: Object.fromEntries(files.map((file) => [file, fs.readFileSync(path.join(root, file), 'utf8')])),
  };
}
