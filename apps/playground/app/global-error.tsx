'use client';
import './globals.css';
import { FailureScreen } from '@/components/FailureScreen';

interface GlobalErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function GlobalErrorPage({ error, reset }: GlobalErrorPageProps) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <FailureScreen digest={error.digest} onRetry={reset} />
      </body>
    </html>
  );
}
