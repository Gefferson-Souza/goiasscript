import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { CHANGESET_BUMPS, CHANGESET_DIR, CHANGESET_README, FRONTMATTER } from './compat-check.constants.ts';
import type { BumpKind, Changeset, GitPort } from './compat-check.types.ts';

const run = promisify(execFile);
const GIT_MAX_BUFFER_BYTES = 67_108_864;
const isBump = (value: unknown): value is BumpKind => CHANGESET_BUMPS.some((bump) => bump === value);

async function git(root: string, args: readonly string[]): Promise<string> {
  return (await run('git', [...args], { cwd: root, maxBuffer: GIT_MAX_BUFFER_BYTES })).stdout;
}

export function createGitPort(root: string): GitPort {
  return {
    listTags: async () => (await git(root, ['tag', '--list'])).split('\n').filter((tag) => tag !== ''),
    readFile: async (ref, file) => {
      try {
        return await git(root, ['show', `${ref}:${file}`]);
      } catch {
        return null;
      }
    },
    listFiles: async (ref, directory) => (await git(root, ['ls-tree', '-r', '--name-only', ref, `${directory}/`])).split('\n').filter((file) => file !== ''),
  };
}

export function parseChangeset(text: string): Changeset {
  const header: unknown = parse(FRONTMATTER.exec(text)?.[1] ?? '');
  const entries = typeof header === 'object' && header !== null ? Object.entries(header) : [];
  return { releases: Object.fromEntries(entries.filter((entry): entry is [string, BumpKind] => isBump(entry[1]))) };
}

export function readChangesets(root: string): readonly Changeset[] {
  const directory = path.join(root, CHANGESET_DIR);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((file) => file.endsWith('.md') && file !== CHANGESET_README)
    .map((file) => parseChangeset(fs.readFileSync(path.join(directory, file), 'utf8')));
}
