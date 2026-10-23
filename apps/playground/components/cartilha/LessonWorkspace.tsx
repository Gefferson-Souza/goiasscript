'use client';
import dynamic from 'next/dynamic';
import type { LessonTab } from '@/lib/cartilha/lesson-session.types';
import type { LessonView } from '@/lib/cartilha/lesson.types';
import { useLessonSession } from '@/lib/cartilha/use-lesson-session';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { OutputPanel } from '../OutputPanel';
import { PRIMER_TEXTS } from './cartilha-texts.constants';
import { ExercisePanel } from './ExercisePanel';
import { ProgressBadge } from './ProgressBadge';

const Editor = dynamic(() => import('../Editor').then((module) => module.Editor), {
  ssr: false,
  loading: () => <div className="flex h-full items-center justify-center text-goias-texto/60">{PRIMER_TEXTS.loadingEditor}</div>,
});

interface Props {
  readonly lesson: LessonView;
}

const TABS: readonly { readonly tab: LessonTab; readonly label: string; readonly testId: string }[] = [
  { tab: 'example', label: PRIMER_TEXTS.tabExample, testId: TEST_IDS.lessonTabExample },
  { tab: 'exercise', label: PRIMER_TEXTS.tabExercise, testId: TEST_IDS.lessonTabExercise },
];


interface TabBarProps {
  readonly active: LessonTab;
  readonly onSelect: (tab: LessonTab) => void;
}

function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <div role="tablist" aria-label={PRIMER_TEXTS.tabsLabel} className="flex gap-1">
      {TABS.map(({ tab, label, testId }) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          data-testid={testId}
          onClick={() => {
            onSelect(tab);
          }}
          className={`rounded px-3 py-1.5 text-sm ${active === tab ? 'bg-goias-amarelo font-semibold text-goias-fundo' : 'border border-goias-borda'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function LessonWorkspace({ lesson }: Props) {
  const session = useLessonSession(lesson);
  const busy = session.running || session.grading;
  return (
    <section aria-label={PRIMER_TEXTS.workspaceLabel} data-testid={TEST_IDS.lessonWorkspace} className="flex min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <TabBar active={session.tab} onSelect={session.selectTab} />
        <ProgressBadge done={session.done} />
      </div>
      <div className="h-[40vh] min-h-[260px] overflow-hidden rounded-md border border-goias-borda">
        <Editor value={session.source} markers={session.markers} onChange={session.edit} />
      </div>
      {session.tab === 'example' ? (
        <>
          <div>
            <button
              type="button"
              data-testid={TEST_IDS.runButton}
              onClick={session.runExample}
              disabled={busy}
              className="rounded bg-goias-verde px-3 py-1.5 text-sm font-semibold text-white hover:bg-goias-verde/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {PRIMER_TEXTS.runExample}
            </button>
          </div>
          <div className="h-56">
            <OutputPanel view={session.runView} onAnswer={session.answer} />
          </div>
        </>
      ) : (
        <ExercisePanel prompt={lesson.exercise.prompt} grade={session.grade} grading={session.grading} busy={busy} onCheck={session.check} />
      )}
    </section>
  );
}
