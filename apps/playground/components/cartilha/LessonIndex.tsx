'use client';
import Link from 'next/link';
import { LESSON_ROUTE_PREFIX } from '@/lib/lesson-routes.constants';
import type { LessonSummary } from '@/lib/cartilha/lesson.types';
import { useCompletedLessons } from '@/lib/cartilha/use-completed-lessons';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { PRIMER_TEXTS } from './cartilha-texts.constants';
import { ProgressBadge } from './ProgressBadge';

interface Props {
  readonly lessons: readonly LessonSummary[];
}

export function LessonIndex({ lessons }: Props) {
  const completed = useCompletedLessons();
  const doneCount = lessons.filter((lesson) => completed.includes(lesson.id)).length;
  return (
    <div className="space-y-4">
      <p role="status" className="text-sm text-dim">
        {PRIMER_TEXTS.indexProgress(doneCount, lessons.length)}
      </p>
      <ol data-testid={TEST_IDS.lessonIndex} className="space-y-2">
        {lessons.map((lesson) => (
          <li key={lesson.id}>
            <Link
              href={`${LESSON_ROUTE_PREFIX}${lesson.id}`}
              data-testid={TEST_IDS.lessonLink}
              data-lesson-id={lesson.id}
              className="flex items-center justify-between gap-3 rounded-md border border-line bg-panel px-4 py-3 hover:border-caret"
            >
              <span>
                <span className="block text-xs text-dim">{PRIMER_TEXTS.lessonLabel(lesson.order)}</span>
                <span className="block font-semibold text-ink">{lesson.title}</span>
                <span className="block text-sm text-dim">{lesson.summary}</span>
              </span>
              <ProgressBadge done={completed.includes(lesson.id)} />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
