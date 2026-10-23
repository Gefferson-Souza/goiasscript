import type { Metadata } from 'next';
import glossary from '@goiasscript/language/generated/glossary.json' with { type: 'json' };
import { GlossaryList } from '@/components/glossary/GlossaryList';
import { GLOSSARY_TEXTS } from '@/lib/glossary.constants';
import { buildGlossaryEntries } from '@/lib/glossary';
import { lessonIdOfTerm } from '@/lib/lesson-routes';

export const metadata: Metadata = { title: 'Glossário', description: GLOSSARY_TEXTS.intro };

export default function GlossaryPage() {
  const entries = buildGlossaryEntries(glossary, lessonIdOfTerm);
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6">
      <h1 className="text-3xl font-bold text-goias-amarelo">{GLOSSARY_TEXTS.title}</h1>
      <p className="text-goias-texto/80">{GLOSSARY_TEXTS.intro}</p>
      <GlossaryList entries={entries} />
    </div>
  );
}
