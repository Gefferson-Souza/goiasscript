import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(import.meta.dirname, '..');
const GENERATED_DIR = path.join(ROOT, 'packages/language/generated');
const VSCODE_DIR = path.join(ROOT, 'packages/vscode');

const GENERATED_ASSETS = [
  { from: 'goiasscript.tmLanguage.json', to: 'syntaxes/goiasscript.tmLanguage.json' },
  { from: 'snippets.json', to: 'snippets/goiasscript.json' },
] as const;

export function copyGeneratedAssets(): void {
  GENERATED_ASSETS.forEach(({ from, to }) => {
    const target = path.join(VSCODE_DIR, to);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(GENERATED_DIR, from), target);
  });
}

export function findStaleGeneratedAssets(): readonly string[] {
  return GENERATED_ASSETS.filter(({ from, to }) => {
    const target = path.join(VSCODE_DIR, to);
    return !fs.existsSync(target) || !fs.readFileSync(target).equals(fs.readFileSync(path.join(GENERATED_DIR, from)));
  }).map(({ to }) => to);
}
