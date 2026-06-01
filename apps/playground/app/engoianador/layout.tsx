import type { Metadata } from 'next';

// A página é 'use client', então a metadata fica neste layout (server).
// O og:image é herdado do app/opengraph-image.tsx da raiz.
export const metadata: Metadata = {
  title: 'Engoianador',
  description: 'Cola qualquer texto e o trem devolve em goianês raiz, sô. 🐂',
  openGraph: {
    title: 'Engoianador — GoiásScript',
    description: 'Cola qualquer texto e o trem devolve em goianês raiz, sô. 🐂',
  },
  twitter: {
    title: 'Engoianador — GoiásScript',
    description: 'Cola qualquer texto e o trem devolve em goianês raiz, sô. 🐂',
  },
};

export default function EngoianadorLayout({ children }: { children: React.ReactNode }) {
  return children;
}
