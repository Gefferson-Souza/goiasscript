'use client';

interface RetryButtonProps {
  readonly label: string;
  readonly onRetry: () => void;
}

export function RetryButton({ label, onRetry }: RetryButtonProps) {
  return (
    <button
      type="button"
      onClick={onRetry}
      className="rounded bg-pequi px-4 py-2 font-semibold text-plane hover:bg-pequi/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-caret"
    >
      {label}
    </button>
  );
}
