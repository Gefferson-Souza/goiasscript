import type { BumpKind } from './compat-check.types.ts';

export const LOCK_FILE = 'docs/spec/vocabulario.lock.json';
export const CONFORMANCE_DIR = 'packages/compiler/tests/conformance';
export const CHANGESET_DIR = '.changeset';
export const CHANGESET_README = 'README.md';
export const STABLE_V3_TAG = /^v3\.(\d+)\.(\d+)$/;
export const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
export const BUMP_ORDER: readonly BumpKind[] = ['none', 'patch', 'minor', 'major'];
export const CHANGESET_BUMPS: readonly BumpKind[] = ['patch', 'minor', 'major'];
export const GITHUB_WARNING_PREFIX = '::warning::';
