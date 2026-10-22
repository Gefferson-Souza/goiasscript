import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReleaseTarget } from './release-target.types.ts';

const ALPHA_TAG = /^v(3\.\d+\.\d+-alpha\.\d+)$/;
const ALPHA_DIST_TAG = 'next';
const ROOT = path.join(import.meta.dirname, '..');
const CLI_MANIFEST = path.join(ROOT, 'packages/cli/package.json');

export function resolveReleaseTarget(tag: string, packageVersion: string): ReleaseTarget {
  const version = ALPHA_TAG.exec(tag)?.[1];
  if (version === undefined) {
    return { ok: false, reason: `Ô rapaz! A tag "${tag}" não é de alpha. Por enquanto só sai v3.x.y-alpha.N.` };
  }
  if (version !== packageVersion) {
    return { ok: false, reason: `Eita! A tag diz ${version} mas o package.json do CLI diz ${packageVersion}.` };
  }
  return { ok: true, version, distTag: ALPHA_DIST_TAG };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tag = process.env['GITHUB_REF_NAME'] ?? '';
  const { version } = JSON.parse(fs.readFileSync(CLI_MANIFEST, 'utf8')) as { readonly version: string };
  const target = resolveReleaseTarget(tag, version);
  if (!target.ok) {
    process.stderr.write(`${target.reason}\n`);
    process.exit(1);
  }
  process.stdout.write(`version=${target.version}\ndist_tag=${target.distTag}\n`);
}
