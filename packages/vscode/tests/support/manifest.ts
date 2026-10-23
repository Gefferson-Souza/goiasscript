import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ExtensionManifest, KeybindingEntry, MenuEntry } from './manifest.types.ts';

export const PACKAGE_ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const REPOSITORY_ROOT = path.join(PACKAGE_ROOT, '../..');

export function readManifest(): ExtensionManifest {
  return JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8')) as ExtensionManifest;
}

export function menusOf(manifest: ExtensionManifest, command: string): readonly MenuEntry[] {
  return Object.values(manifest.contributes.menus)
    .flat()
    .filter((entry) => entry.command === command);
}

export function keybindingsOf(manifest: ExtensionManifest, command: string): readonly KeybindingEntry[] {
  return manifest.contributes.keybindings.filter((binding) => binding.command === command);
}
