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
        <h3 className="text-xs font-semibold text-goias-amarelo">{PRIMER_TEXTS.expectedTitle}</h3>
        <pre data-testid={TEST_IDS.exerciseExpected} className="whitespace-pre-wrap rounded bg-goias-fundo p-2 font-mono text-sm">
          {shown(grade.expectedStdout)}
        </pre>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-goias-amarelo">{PRIMER_TEXTS.actualTitle}</h3>
        <pre data-testid={TEST_IDS.exerciseActual} className="whitespace-pre-wrap rounded bg-goias-fundo p-2 font-mono text-sm">
          {shown(grade.actualStdout)}
        </pre>
      </div>
    </div>
  );
}

function Verdict({ grade }: { readonly grade: GradeResult }) {
  const detail = grade.diagnostic?.message ?? grade.reason;
  return (
    <div data-testid={TEST_IDS.exerciseVerdict} data-verdict={grade.verdict} role="status" className="mt-3 rounded border border-goias-borda p-3 text-sm">
      <p className={grade.verdict === 'correct' ? 'font-semibold text-green-300' : 'font-semibold text-yellow-300'}>{VERDICT_TEXTS[grade.verdict]}</p>
      {detail !== undefined && <p className="mt-1 whitespace-pre-wrap text-goias-texto/80">{detail}</p>}
      {grade.verdict === 'wrong' && <Comparison grade={grade} />}
    </div>
  );
}

export function ExercisePanel({ prompt, grade, grading, busy, onCheck }: Props) {
  return (
    <section aria-label={PRIMER_TEXTS.exerciseTitle} className="rounded-md border border-goias-borda bg-goias-painel p-3">
      <h2 className="text-sm font-semibold text-goias-amarelo">{PRIMER_TEXTS.exerciseTitle}</h2>
      <p className="mt-1 text-sm">{prompt}</p>
      <p className="text-xs text-goias-texto/60">{PRIMER_TEXTS.exerciseHint}</p>
      <button
        type="button"
        data-testid={TEST_IDS.exerciseCheckButton}
        onClick={onCheck}
        disabled={busy}
        className="mt-3 rounded bg-goias-verde px-3 py-1.5 text-sm font-semibold text-white hover:bg-goias-verde/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {grading ? PRIMER_TEXTS.checking : PRIMER_TEXTS.checkExercise}
      </button>
      {grade !== null && <Verdict grade={grade} />}
    </section>
  );
}
