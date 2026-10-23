import { LessonIndex } from '@/components/cartilha/LessonIndex';
import { PRIMER_TEXTS } from '@/components/cartilha/cartilha-texts.constants';
import { loadPrimer, toLessonSummary } from '@/lib/cartilha/cartilha-content';

export default function PrimerIndexPage() {
  const lessons = loadPrimer().map(toLessonSummary);
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-3xl font-bold text-goias-amarelo">{PRIMER_TEXTS.indexTitle}</h1>
      <p className="text-goias-texto/80">{PRIMER_TEXTS.indexIntro}</p>
      <LessonIndex lessons={lessons} />
    </div>
  );
}
