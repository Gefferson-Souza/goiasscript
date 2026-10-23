import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReleaseTarget, ReleaseTargetOptions } from './release-target.types.ts';

const ALPHA_TAG = /^v(3\.\d+\.\d+-alpha\.\d+)$/;
const STABLE_TAG = /^v(3\.\d+\.\d+)$/;
const ALPHA_DIST_TAG = 'next';
const STABLE_DIST_TAG = 'latest';
const ROOT = path.join(import.meta.dirname, '..');
const CLI_MANIFEST = path.join(ROOT, 'packages/cli/package.json');
const CHANGESET_DIR = path.join(ROOT, '.changeset');
const CHANGESET_FILE = /^(?!README\.md$).+\.md$/;
const FRONTMATTER_FENCE = '---';

export function resolveReleaseTarget(tag: string, packageVersion: string, options: ReleaseTargetOptions): ReleaseTarget {
  const alphaVersion = ALPHA_TAG.exec(tag)?.[1];
  const stableVersion = STABLE_TAG.exec(tag)?.[1];
  const version = alphaVersion ?? stableVersion;
  if (version === undefined) {
    return { ok: false, reason: `Ô rapaz! A tag "${tag}" não serve. Só sai v3.x.y ou v3.x.y-alpha.N.` };
  }
  if (version !== packageVersion) {
    return { ok: false, reason: `Eita! A tag diz ${version} mas o package.json do CLI diz ${packageVersion}.` };
  }
  if (alphaVersion !== undefined) {
    return { ok: true, version, distTag: ALPHA_DIST_TAG };
  }
  if (options.changesetsPending) {
    return { ok: false, reason: `Ô rapaz! Ainda tem changeset pendente. Aplique o versionamento antes de soltar a ${tag}.` };
  }
  return { ok: true, version, distTag: STABLE_DIST_TAG };
}

export function hasPendingChangesets(directory: string): boolean {
  let names: readonly string[];
  try {
    names = fs.readdirSync(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Eita! Não achei a pasta de changesets em ${directory}.`, { cause: error });
    }
    throw error;
  }
  return names
    .filter((name) => CHANGESET_FILE.test(name))
    .some((name) => fs.readFileSync(path.join(directory, name), 'utf8').startsWith(FRONTMATTER_FENCE));
}

function run(): void {
  const tag = process.env['GITHUB_REF_NAME'] ?? '';
  const { version } = JSON.parse(fs.readFileSync(CLI_MANIFEST, 'utf8')) as { readonly version: string };
  const target = resolveReleaseTarget(tag, version, { changesetsPending: hasPendingChangesets(CHANGESET_DIR) });
  if (!target.ok) {
    process.stderr.write(`${target.reason}\n`);
    process.exit(1);
  }
  process.stdout.write(`version=${target.version}\ndist_tag=${target.distTag}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    run();
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
