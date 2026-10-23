import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MARKETPLACE_API_ACCEPT,
  MARKETPLACE_CRITERIA_EXTENSION_NAME,
  MARKETPLACE_FLAG_INCLUDE_VERSIONS,
  MARKETPLACE_PAGE_SIZE,
  MARKETPLACE_QUERY_URL,
  OPEN_VSX_API_URL,
} from './smoke-extension.constants.ts';
import type { ExtensionIds, SmokeFailure, SmokeFetch, SmokeRegistry } from './smoke-extension.types.ts';

const EXTENSION_MANIFEST = path.join(import.meta.dirname, '../packages/vscode/package.json');

type RegistryCheck = (fetchFn: SmokeFetch, ids: ExtensionIds) => Promise<string | null>;

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function marketplaceVersions(body: unknown): readonly string[] {
  const extensions = isRecord(body) && Array.isArray(body['results']) && isRecord(body['results'][0]) ? body['results'][0]['extensions'] : undefined;
  const first: unknown = Array.isArray(extensions) ? extensions[0] : undefined;
  const versions = isRecord(first) && Array.isArray(first['versions']) ? first['versions'] : [];
  return versions.flatMap((entry) => (isRecord(entry) && typeof entry['version'] === 'string' ? [entry['version']] : []));
}

const checkMarketplace: RegistryCheck = async (fetchFn, ids) => {
  const body = JSON.stringify({
    filters: [
      {
        criteria: [{ filterType: MARKETPLACE_CRITERIA_EXTENSION_NAME, value: `${ids.publisher}.${ids.name}` }],
        pageNumber: 1,
        pageSize: MARKETPLACE_PAGE_SIZE,
      },
    ],
    flags: MARKETPLACE_FLAG_INCLUDE_VERSIONS,
  });
  const response = await fetchFn(MARKETPLACE_QUERY_URL, {
    method: 'POST',
    headers: { Accept: MARKETPLACE_API_ACCEPT, 'Content-Type': 'application/json' },
    body,
  });
  if (!response.ok) return `Marketplace respondeu ${String(response.status)}.`;
  const versions = marketplaceVersions(await response.json());
  return versions.includes(ids.version) ? null : `Marketplace não tem a versão ${ids.version} (achei: ${versions.join(', ') || 'nenhuma'}).`;
};

const checkOpenVsx: RegistryCheck = async (fetchFn, ids) => {
  const response = await fetchFn(`${OPEN_VSX_API_URL}/${ids.publisher}/${ids.name}/${ids.version}`);
  if (!response.ok) return `Open VSX respondeu ${String(response.status)} para a versão ${ids.version}.`;
  const payload = await response.json();
  const found = isRecord(payload) ? payload['version'] : undefined;
  return found === ids.version ? null : `Open VSX devolveu a versão ${String(found)} em vez de ${ids.version}.`;
};

const REGISTRY_CHECKS: ReadonlyArray<readonly [SmokeRegistry, RegistryCheck]> = [
  ['marketplace', checkMarketplace],
  ['open-vsx', checkOpenVsx],
];

async function runCheck(registry: SmokeRegistry, check: RegistryCheck, fetchFn: SmokeFetch, ids: ExtensionIds): Promise<SmokeFailure | null> {
  try {
    const message = await check(fetchFn, ids);
    return message === null ? null : { registry, message };
  } catch (error) {
    return { registry, message: `Falhou ao consultar: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function runExtensionSmoke(fetchFn: SmokeFetch, ids: ExtensionIds): Promise<readonly SmokeFailure[]> {
  const results = await Promise.all(REGISTRY_CHECKS.map(([registry, check]) => runCheck(registry, check, fetchFn, ids)));
  return results.filter((failure): failure is SmokeFailure => failure !== null);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const manifest = JSON.parse(fs.readFileSync(EXTENSION_MANIFEST, 'utf8')) as { readonly name: string; readonly publisher: string; readonly version: string };
  const publisher = process.env['GS_EXTENSION_PUBLISHER'] ?? manifest.publisher;
  const failures = await runExtensionSmoke(fetch, { publisher, name: manifest.name, version: manifest.version });
  failures.forEach((failure) => process.stderr.write(`${failure.registry}: ${failure.message}\n`));
  if (failures.length > 0) process.exit(1);
  process.stdout.write('Tá pronto, sô! A versão está nos dois lugares.\n');
}
