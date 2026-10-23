import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { VscodeReleaseTarget } from './release-target-vscode.types.ts';

const TAG_PATTERN = /^vscode-v(\d+\.\d+\.\d+)$/;
const STABLE_MAJOR_FLOOR = 3;
const ROOT = path.join(import.meta.dirname, '..');
const EXTENSION_MANIFEST = path.join(ROOT, 'packages/vscode/package.json');

// O Marketplace não aceita sufixo de pré-lançamento na versão: o canal é decidido pelo número.
export function isPreReleaseVersion(version: string): boolean {
  return Number(version.split('.')[0]) < STABLE_MAJOR_FLOOR;
}

export function resolveVscodeReleaseTarget(tag: string, manifestVersion: string): VscodeReleaseTarget {
  const version = TAG_PATTERN.exec(tag)?.[1];
  if (version === undefined) {
    return { ok: false, reason: `Ô rapaz! A tag "${tag}" não serve. A extensão sai com vscode-vX.Y.Z, sem sufixo.` };
  }
  if (version !== manifestVersion) {
    return { ok: false, reason: `Eita! A tag diz ${version} mas o package.json da extensão diz ${manifestVersion}.` };
  }
  return { ok: true, version, preRelease: isPreReleaseVersion(version) };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tag = process.env['GITHUB_REF_NAME'] ?? '';
  const { version } = JSON.parse(fs.readFileSync(EXTENSION_MANIFEST, 'utf8')) as { readonly version: string };
  const target = resolveVscodeReleaseTarget(tag, version);
  if (!target.ok) {
    process.stderr.write(`${target.reason}\n`);
    process.exit(1);
  }
  process.stdout.write(`version=${target.version}\npre_release=${String(target.preRelease)}\n`);
}
