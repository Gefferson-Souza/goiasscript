import { LESSON_BY_NAMESPACE, lessonForStdlibEntry, lookupStdlibMember, lookupStdlibStatic } from '@goiasscript/language';

import type { MemberLesson } from './member-lesson.types.ts';

const NAMESPACE_SEPARATOR = '.';

export const namespaceLesson = (namespace: string): string | null => LESSON_BY_NAMESPACE.get(namespace) ?? null;

// Lição pelo receptor do membro da biblioteca; nome de receptores com lições diferentes fica com a do código.
export function stdlibMemberLesson(name: string): MemberLesson {
  const separatorAt = name.indexOf(NAMESPACE_SEPARATOR);
  if (separatorAt >= 0) {
    const entry = lookupStdlibStatic(name.slice(0, separatorAt), name.slice(separatorAt + 1));
    return entry === undefined ? undefined : (lessonForStdlibEntry(entry) ?? null);
  }
  const lessons = new Set(lookupStdlibMember(name).map((entry) => lessonForStdlibEntry(entry) ?? null));
  return lessons.size === 1 ? [...lessons][0] : undefined;
}
