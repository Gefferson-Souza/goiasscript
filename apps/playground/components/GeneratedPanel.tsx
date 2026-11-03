import { TEST_IDS } from '@/lib/test-ids.constants';
import type { TargetView } from '@/lib/compile-service.types';
import { TargetSwitch } from './TargetSwitch';
import { TEXTS } from './ui-texts.constants';

interface Props {
  readonly code: string | null;
  readonly hiddenMarkerCount: number;
  readonly target: TargetView;
  readonly onTargetChange: (target: TargetView) => void;
}

export function GeneratedPanel({ code, hiddenMarkerCount, target, onTargetChange }: Props) {
  return (
    <section aria-label={TEXTS.generatedTitle} className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-line bg-panel">
      <div className="flex items-center justify-between gap-2 border-b border-line px-3 py-2">
        <h2 className="text-sm font-semibold text-cyan">{TEXTS.generatedTitle}</h2>
        <TargetSwitch value={target} onChange={onTargetChange} />
      </div>
      <div className="flex-1 overflow-auto p-3 font-mono text-xs">
        {code === null ? (
          <p className="text-dim">{TEXTS.generatedEmpty}</p>
        ) : (
          <pre data-testid={TEST_IDS.generatedCode} className="whitespace-pre-wrap text-ink">
            {code}
          </pre>
        )}
        {hiddenMarkerCount > 0 && <p className="mt-2 text-warn">{TEXTS.hiddenMarkers(hiddenMarkerCount)}</p>}
      </div>
    </section>
  );
}
