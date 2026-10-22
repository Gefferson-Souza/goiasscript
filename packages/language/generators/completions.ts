import { COMPLETION_LABELS } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';
import { toJson } from './shared.ts';

export function renderCompletionsFiles(): readonly GeneratedFile[] {
  const completions = COMPLETION_LABELS.map(({ label, detail, kind }) => ({ label, detail, kind }));
  return [{ path: 'packages/language/generated/completions.json', content: toJson(completions) }];
}
