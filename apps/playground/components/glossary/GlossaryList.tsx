import Link from 'next/link';
import { GLOSSARY_TEXTS } from '@/lib/glossary.constants';
import type { GlossaryEntry, GlossaryGroup } from '@/lib/glossary.types';

interface Props {
  readonly entries: readonly GlossaryEntry[];
}

function Section({ title, group, entries }: { readonly title: string; readonly group: GlossaryGroup; readonly entries: readonly GlossaryEntry[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-bold text-goias-yellow">{title}</h2>
      <dl className="space-y-3">
        {entries
          .filter((entry) => entry.group === group)
          .map((entry) => (
            <div key={entry.anchor} id={entry.anchor} className="scroll-mt-20">
              <dt className="font-mono font-bold">{entry.term}</dt>
              <dd className="text-sm text-goias-text/80">
                {GLOSSARY_TEXTS.jsLabel} <code>{entry.js}</code>
                {entry.detail === '' ? null : <span> · {entry.detail}</span>}
                {entry.lessonUrl === undefined ? null : (
                  <>
                    {' · '}
                    <Link href={entry.lessonUrl} className="text-goias-yellow underline">
                      {GLOSSARY_TEXTS.lessonLink}
                    </Link>
                  </>
                )}
              </dd>
            </div>
          ))}
      </dl>
    </section>
  );
}

export function GlossaryList({ entries }: Props) {
  return (
    <div className="space-y-8">
      <Section title={GLOSSARY_TEXTS.keywordsTitle} group="keyword" entries={entries} />
      <Section title={GLOSSARY_TEXTS.libraryTitle} group="library" entries={entries} />
    </div>
  );
}
