import type { StdlibEntry } from './stdlib.types.ts';
import { LESSON_BY_NAMESPACE, LESSON_BY_RECEIVER } from './lesson-by-receiver.data.ts';

const NAMESPACE_SEPARATOR = '.';

export function lessonForStdlibEntry(entry: StdlibEntry): string | undefined {
  if (entry.receiver !== 'namespace') return LESSON_BY_RECEIVER[entry.receiver];
  const separatorAt = entry.name.indexOf(NAMESPACE_SEPARATOR);
  return separatorAt < 0 ? undefined : LESSON_BY_NAMESPACE.get(entry.name.slice(0, separatorAt));
}
