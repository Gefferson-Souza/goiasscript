'use client';
import { FailureScreen } from '@/components/FailureScreen';

interface ErrorPageProps {
  readonly error: Error & { digest?: string };
  readonly reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return <FailureScreen digest={error.digest} onRetry={reset} />;
}
