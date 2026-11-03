import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Playground',
  description: 'Escreve goianês, bota pra moer e vê o JavaScript e a saída na hora.',
};

export default function PlaygroundLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
