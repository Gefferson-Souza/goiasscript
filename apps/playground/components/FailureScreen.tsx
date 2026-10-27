'use client';
import { ERROR_COPY } from '@/lib/error-pages.constants';
import { ErrorScreen } from './ErrorScreen';
import { RetryButton } from './RetryButton';

interface FailureScreenProps {
  readonly digest?: string | undefined;
  readonly onRetry: () => void;
}

export function FailureScreen({ digest, onRetry }: FailureScreenProps) {
  const { title, message, retryLabel, digestLabel } = ERROR_COPY.failed;
  return (
    <ErrorScreen title={title} message={message}>
      <RetryButton label={retryLabel} onRetry={onRetry} />
      {digest === undefined ? null : (
        <p className="text-xs text-goias-text/60">
          {digestLabel}: {digest}
        </p>
      )}
    </ErrorScreen>
  );
}
