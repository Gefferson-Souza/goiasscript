import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Cartilha',
  description: 'Aprende a programar em goianês, uma lição de cada vez.',
};

export default function PrimerLayout({ children }: { readonly children: ReactNode }) {
  return <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</div>;
}
