import fs from 'node:fs';
import path from 'node:path';
import { IGNORED_DOC_DIRS, IGNORED_DOC_PREFIX } from './docs-gate.constants.ts';
import type { DocFile } from './docs-gate.types.ts';

const MARKDOWN = /\.md$/u;
const toPosix = (relative: string): string => relative.split(path.sep).join('/');

const isIgnored = (relative: string): boolean =>
  IGNORED_DOC_DIRS.some((dir) => relative === dir || relative.startsWith(`${dir}/`)) || relative.startsWith(IGNORED_DOC_PREFIX);

function walk(root: string, relative: string): readonly string[] {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute) || isIgnored(toPosix(relative))) return [];
  if (fs.statSync(absolute).isFile()) return MARKDOWN.test(relative) ? [toPosix(relative)] : [];
  return fs.readdirSync(absolute).flatMap((name) => walk(root, path.join(relative, name)));
}

export function collectMarkdown(root: string, sources: readonly string[]): readonly DocFile[] {
  return sources.flatMap((source) => walk(root, source)).map((file) => ({ file, text: fs.readFileSync(path.join(root, file), 'utf8') }));
}
