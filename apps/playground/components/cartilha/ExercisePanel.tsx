import type { GradeResult } from '@/lib/cartilha/grade-exercise.types';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { PRIMER_TEXTS, VERDICT_TEXTS } from './cartilha-texts.constants';

interface Props {
  readonly prompt: string;
  readonly grade: GradeResult | null;
  readonly grading: boolean;
  readonly busy: boolean;
  readonly onCheck: () => void;
}

const shown = (text: string): string => (text === '' ? PRIMER_TEXTS.emptyOutput : text);

function Comparison({ grade }: { readonly grade: GradeResult }) {
  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      <div>
        <h3 className="text-xs font-semibold text-ink">{PRIMER_TEXTS.expectedTitle}</h3>
        <pre data-testid={TEST_IDS.exerciseExpected} className="whitespace-pre-wrap rounded bg-plane p-2 font-mono text-sm">
          {shown(grade.expectedStdout)}
        </pre>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-ink">{PRIMER_TEXTS.actualTitle}</h3>
        <pre data-testid={TEST_IDS.exerciseActual} className="whitespace-pre-wrap rounded bg-plane p-2 font-mono text-sm">
          {shown(grade.actualStdout)}
        </pre>
      </div>
    </div>
  );
}

function Verdict({ grade }: { readonly grade: GradeResult }) {
  const detail = grade.diagnostic?.message ?? grade.reason;
  return (
    <div data-testid={TEST_IDS.exerciseVerdict} data-verdict={grade.verdict} role="status" className="mt-3 rounded border border-line p-3 text-sm">
      <p className={grade.verdict === 'correct' ? 'font-semibold text-ok' : 'font-semibold text-warn'}>{VERDICT_TEXTS[grade.verdict]}</p>
      {detail !== undefined && <p className="mt-1 whitespace-pre-wrap text-dim">{detail}</p>}
      {grade.verdict === 'wrong' && <Comparison grade={grade} />}
    </div>
  );
}

export function ExercisePanel({ prompt, grade, grading, busy, onCheck }: Props) {
  return (
    <section aria-label={PRIMER_TEXTS.exerciseTitle} className="rounded-md border border-line bg-panel p-3">
      <h2 className="text-sm font-semibold text-ink">{PRIMER_TEXTS.exerciseTitle}</h2>
      <p className="mt-1 text-sm">{prompt}</p>
      <p className="text-xs text-dim">{PRIMER_TEXTS.exerciseHint}</p>
      <button
        type="button"
        data-testid={TEST_IDS.exerciseCheckButton}
        onClick={onCheck}
        disabled={busy}
        className="mt-3 rounded bg-pequi px-3 py-1.5 text-sm font-semibold text-plane hover:bg-pequi/85 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {grading ? PRIMER_TEXTS.checking : PRIMER_TEXTS.checkExercise}
      </button>
      {grade !== null && <Verdict grade={grade} />}
    </section>
  );
}
