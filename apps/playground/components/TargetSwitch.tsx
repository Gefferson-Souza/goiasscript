'use client';
import type { TargetView } from '@/lib/compile-service.types';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { TEXTS } from './ui-texts.constants';

interface Props {
  readonly value: TargetView;
  readonly onChange: (value: TargetView) => void;
}

const OPTIONS: readonly { readonly value: TargetView; readonly label: string }[] = [
  { value: 'didactic', label: TEXTS.didactic },
  { value: 'optimized', label: TEXTS.optimized },
];

export function TargetSwitch({ value, onChange }: Props) {
  return (
    <div role="radiogroup" aria-label={TEXTS.targetLabel} data-testid={TEST_IDS.targetSwitch} className="flex gap-1 text-xs">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded px-2 py-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-caret ${
            value === option.value ? 'bg-caret font-semibold text-plane' : 'border border-edge text-dim hover:text-caret'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
