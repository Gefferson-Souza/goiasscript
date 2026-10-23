import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { buildVscode } from './build-vscode.ts';
import { isPreReleaseVersion } from './release-target-vscode.ts';
import type { PackVscodeOptions, PackVscodeResult } from './pack-vscode.types.ts';

const execFileAsync = promisify(execFile);
const ROOT = path.join(import.meta.dirname, '..');
const VSCODE_DIR = path.join(ROOT, 'packages/vscode');
const PUBLISHER_VARIABLE = 'GS_EXTENSION_PUBLISHER';
const STAGED_FILES = ['README.md', 'CHANGELOG.md', 'language-configuration.json', '.vscodeignore'] as const;
const STAGED_DIRECTORIES = ['syntaxes', 'snippets', 'assets'] as const;

interface ExtensionManifest {
  readonly name: string;
  readonly version: string;
  readonly publisher: string;
}

function resolveVsceScript(): string {
  const manifestPath = createRequire(path.join(VSCODE_DIR, 'package.json')).resolve('@vscode/vsce/package.json');
  const { bin } = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { readonly bin: Readonly<Record<string, string>> };
  return path.join(path.dirname(manifestPath), bin['vsce'] ?? 'vsce');
}

function stageSources(stagingDir: string, publisher: string | undefined): ExtensionManifest {
  const manifest = JSON.parse(fs.readFileSync(path.join(VSCODE_DIR, 'package.json'), 'utf8')) as ExtensionManifest;
  const stagedManifest = publisher === undefined || publisher === '' ? manifest : { ...manifest, publisher };
  fs.writeFileSync(path.join(stagingDir, 'package.json'), `${JSON.stringify(stagedManifest, null, 2)}\n`);
  fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(stagingDir, 'LICENSE'));
  STAGED_FILES.forEach((name) => {
    fs.copyFileSync(path.join(VSCODE_DIR, name), path.join(stagingDir, name));
  });
  STAGED_DIRECTORIES.filter((name) => fs.existsSync(path.join(VSCODE_DIR, name))).forEach((name) => {
    fs.cpSync(path.join(VSCODE_DIR, name), path.join(stagingDir, name), { recursive: true });
  });
  return stagedManifest;
}

// O empacotamento acontece numa cópia: o publisher trocado nunca volta para o manifesto do repositório.
export async function packVscode(options: PackVscodeOptions): Promise<PackVscodeResult> {
  const outDir = path.resolve(options.outDir);
  fs.mkdirSync(outDir, { recursive: true });
  const stagingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-vsix-'));
  try {
    const manifest = stageSources(stagingDir, (options.env ?? process.env)[PUBLISHER_VARIABLE]);
    await buildVscode({ outDir: path.join(stagingDir, 'dist') });
    const vsix = path.join(outDir, `${manifest.name}-${manifest.version}.vsix`);
    // O vsix já nasce no canal certo: o vsce recusa publicar como pré-lançamento um pacote que não foi empacotado assim.
    const channelArgs = isPreReleaseVersion(manifest.version) ? ['--pre-release'] : [];
    await execFileAsync(process.execPath, [resolveVsceScript(), 'package', '--no-dependencies', ...channelArgs, '--out', vsix], { cwd: stagingDir });
    return { vsix, sha256: createHash('sha256').update(fs.readFileSync(vsix)).digest('hex') };
  } finally {
    fs.rmSync(stagingDir, { recursive: true, force: true });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = await packVscode({ outDir: path.join(VSCODE_DIR, 'pack') });
  process.stdout.write(`${result.vsix}\n${result.sha256}\n`);
}
