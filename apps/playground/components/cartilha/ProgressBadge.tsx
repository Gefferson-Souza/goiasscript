import { TEST_IDS } from '@/lib/test-ids.constants';
import { PRIMER_TEXTS } from './cartilha-texts.constants';

interface Props {
  readonly done: boolean;
}

export function ProgressBadge({ done }: Props) {
  if (!done) return <span className="text-xs text-goias-texto/50">{PRIMER_TEXTS.todoBadge}</span>;
  return (
    <span data-testid={TEST_IDS.lessonDoneBadge} className="rounded bg-goias-verde/30 px-2 py-0.5 text-xs font-semibold text-green-300">
      {PRIMER_TEXTS.doneBadge}
    </span>
  );
}
