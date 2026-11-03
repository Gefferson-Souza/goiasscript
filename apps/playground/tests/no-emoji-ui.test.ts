import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const PLAYGROUND_ROOT = path.join(import.meta.dirname, '..');
const SCANNED_DIRS = ['app', 'components'] as const;
const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.svg']);
const EMOJI = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

function listFiles(dir: string): readonly string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(full);
    return SCANNED_EXTENSIONS.has(path.extname(entry.name)) ? [full] : [];
  });
}

const FILES = SCANNED_DIRS.flatMap((dir) => listFiles(path.join(PLAYGROUND_ROOT, dir)));

describe('interface sem emoji', () => {
  // Emoji muda de desenho entre sistemas e quebra a identidade; a marca é desenhada em SVG.
  it.each(FILES.map((file) => [path.relative(PLAYGROUND_ROOT, file)]))('%s não tem emoji', (relative) => {
    const source = fs.readFileSync(path.join(PLAYGROUND_ROOT, relative), 'utf8');
    expect(source.match(EMOJI)?.[0] ?? null).toBeNull();
  });
});
