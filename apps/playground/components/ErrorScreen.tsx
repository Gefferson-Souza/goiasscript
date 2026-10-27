import type { ReactNode } from 'react';

interface ErrorScreenProps {
  readonly title: string;
  readonly message: string;
  readonly children?: ReactNode;
}

export function ErrorScreen({ title, message, children }: ErrorScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-3xl font-bold text-goias-yellow">{title}</h1>
      <p className="text-goias-text/80">{message}</p>
      {children}
    </div>
  );
}
