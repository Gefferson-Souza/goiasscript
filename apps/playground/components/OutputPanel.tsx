import type { RunViewLine, RunViewState } from '@/lib/run/run-state-view.types';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { AskBox } from './AskBox';
import { STATUS_LABELS, TEXTS } from './ui-texts.constants';

interface Props {
  readonly view: RunViewState;
  readonly onAnswer: (value: string) => void;
}

const LINE_CLASS: Readonly<Record<RunViewLine['stream'], string>> = {
  out: 'text-goias-text',
  err: 'text-red-400',
};

function Lines({ view }: { readonly view: RunViewState }) {
  if (view.status === 'idle') return <p className="text-goias-text/60">{TEXTS.idleOutput}</p>;
  if (view.status === 'finished' && view.lines.length === 0) return <p className="text-goias-text/60">{TEXTS.silentRun}</p>;
  return (
    <div className="space-y-1">
      {view.lines.map((line, index) => (
        <div key={index} data-stream={line.stream} className={LINE_CLASS[line.stream]}>
          <span className="mr-2 text-goias-text/40">{line.stream === 'err' ? '!' : '›'}</span>
          <span className="whitespace-pre-wrap">{line.text}</span>
        </div>
      ))}
    </div>
  );
}

export function OutputPanel({ view, onAnswer }: Props) {
  return (
    <section aria-label={TEXTS.outputTitle} className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-goias-border bg-goias-panel">
      <div className="flex items-center justify-between border-b border-goias-border px-3 py-2">
        <h2 className="text-sm font-semibold text-goias-yellow">{TEXTS.outputTitle}</h2>
        <div className="text-xs text-goias-text/60" role="status" aria-live="polite">
          {STATUS_LABELS[view.status]}
        </div>
      </div>
      <div data-testid={TEST_IDS.output} className="flex-1 overflow-auto p-3 font-mono text-sm">
        <Lines view={view} />
        {view.notice !== null && <p className="mt-3 whitespace-pre-wrap text-yellow-300">{view.notice}</p>}
        {view.pendingPrompt !== null && <AskBox prompt={view.pendingPrompt} onAnswer={onAnswer} />}
      </div>
    </section>
  );
}
