import type { Metadata } from 'next';
import Link from 'next/link';
import { PRIMER_TEXTS } from '@/components/cartilha/cartilha-texts.constants';
import { WhatChanged } from '@/components/cartilha/WhatChanged';
import { PRIMER_INDEX_PATH } from '@/lib/cartilha/cartilha-content.constants';
import { loadWhatChanged } from '@/lib/cartilha/what-changed';

export const metadata: Metadata = { title: 'O que mudou', description: 'As palavras aposentadas e a forma nova de cada uma.' };

export default function WhatChangedPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link href={PRIMER_INDEX_PATH} className="text-sm hover:text-goias-amarelo">
        {PRIMER_TEXTS.backToIndex}
      </Link>
      <WhatChanged markdown={loadWhatChanged()} />
    </div>
  );
}
