export interface LessonIndex {
  readonly lessonIds: readonly string[];
  readonly terms: Readonly<Record<string, string>>;
}
