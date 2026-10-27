import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PRIMER_TEXTS } from '@/components/cartilha/cartilha-texts.constants';
import { LessonProse } from '@/components/cartilha/LessonProse';
import { LessonWorkspace } from '@/components/cartilha/LessonWorkspace';
import { lessonStaticParams, loadPrimer, toLessonView } from '@/lib/cartilha/cartilha-content';
import { PRIMER_INDEX_PATH } from '@/lib/cartilha/cartilha-content.constants';
import { LESSON_ROUTE_PREFIX } from '@/lib/lesson-routes.constants';
import { TEST_IDS } from '@/lib/test-ids.constants';

interface PageProps {
  readonly params: Promise<{ readonly id: string }>;
}

// Id fora da lista cai no 404 do próprio Next, sem rodar página nenhuma.
export const dynamicParams = false;

export const generateStaticParams = () => lessonStaticParams(loadPrimer()).map(({ id }) => ({ id }));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const lesson = loadPrimer().find((candidate) => candidate.id === id);
  return lesson === undefined ? {} : { title: lesson.title, description: lesson.summary };
}

export default async function LessonPage({ params }: PageProps) {
  const { id } = await params;
  const lessons = loadPrimer();
  const index = lessons.findIndex((candidate) => candidate.id === id);
  const lesson = lessons[index];
  if (lesson === undefined) notFound();
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  return (
    <div className="space-y-4">
      <nav className="flex flex-wrap justify-between gap-2 text-sm">
        <Link href={PRIMER_INDEX_PATH} className="hover:text-goias-yellow">
          {PRIMER_TEXTS.backToIndex}
        </Link>
        <span className="flex gap-4">
          {previous !== undefined && <Link href={`${LESSON_ROUTE_PREFIX}${previous.id}`}>{PRIMER_TEXTS.previous}</Link>}
          {next !== undefined && <Link href={`${LESSON_ROUTE_PREFIX}${next.id}`}>{PRIMER_TEXTS.next}</Link>}
        </span>
      </nav>
      <p className="text-xs text-goias-text/60">{PRIMER_TEXTS.lessonLabel(lesson.order)}</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <article data-testid={TEST_IDS.lessonProse}>
          <LessonProse markdown={lesson.bodyMarkdown} />
        </article>
        <LessonWorkspace lesson={toLessonView(lesson)} />
      </div>
    </div>
  );
}
