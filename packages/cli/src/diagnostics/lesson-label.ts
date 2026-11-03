import { lessonTitleOf } from '@goiasscript/language';
import { LESSON_SOURCE_LABEL } from './render-diagnostic.constants.ts';

// Id que não está na cartilha (página avulsa de docs) aparece como veio.
export function lessonLabel(lessonId: string): string {
  const title = lessonTitleOf(lessonId);
  return title === undefined ? lessonId : `${title} (${LESSON_SOURCE_LABEL}, ${lessonId})`;
}
