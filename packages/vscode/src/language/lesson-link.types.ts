export interface LessonLookup {
  readonly lessonIdOf: (term: string) => string | undefined;
}
