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
      className="rounded bg-goias-verde px-4 py-2 font-semibold text-white hover:bg-goias-verde/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
    >
      {label}
    </button>
  );
}
