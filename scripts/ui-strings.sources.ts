import { execFileSync } from 'node:child_process';
import { UI_SOURCE_EXCLUSIONS, UI_SOURCE_FILE, UI_SOURCE_ROOTS } from './gate.constants.ts';

const GIT_LIST_MAX_BYTES = 67_108_864;
const GIT_LIST_ARGS: readonly string[] = ['ls-files', '--cached', '--others', '--exclude-standard'];

export function isUiSource(file: string): boolean {
  return UI_SOURCE_FILE.test(file) && UI_SOURCE_ROOTS.some((prefix) => file.startsWith(prefix)) && !(file in UI_SOURCE_EXCLUSIONS);
}

export function discoverUiSourceFiles(root: string): readonly string[] {
  const listed = execFileSync('git', GIT_LIST_ARGS, { cwd: root, encoding: 'utf8', maxBuffer: GIT_LIST_MAX_BYTES });
  return listed.split('\n').filter(isUiSource).sort();
}
