import type { RunViewLine, RunViewState } from '@/lib/run/run-state-view.types';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { AskBox } from './AskBox';
import { STATUS_LABELS, TEXTS } from './ui-texts.constants';

interface Props {
  readonly view: RunViewState;
  readonly onAnswer: (value: string) => void;
}

const LINE_CLASS: Readonly<Record<RunViewLine['stream'], string>> = {
  out: 'text-ink',
  err: 'text-error',
};

// O texto do status já diz o que houve; a cor reforça, nunca carrega o sentido sozinha.
const STATUS_CLASS: Readonly<Record<RunViewState['status'], string>> = {
  idle: 'text-dim',
  running: 'text-dim',
  asking: 'text-ink',
  finished: 'text-ok',
  failed: 'text-error',
  timeout: 'text-error',
  stopped: 'text-warn',
};

function Lines({ view }: { readonly view: RunViewState }) {
  if (view.status === 'idle') return <p className="text-dim">{TEXTS.idleOutput}</p>;
  if (view.status === 'finished' && view.lines.length === 0) return <p className="text-dim">{TEXTS.silentRun}</p>;
  return (
    <div className="space-y-1">
      {view.lines.map((line, index) => (
        <div key={index} data-stream={line.stream} className={LINE_CLASS[line.stream]}>
          <span className="mr-2 text-dim">{line.stream === 'err' ? '!' : '›'}</span>
          <span className="whitespace-pre-wrap">{line.text}</span>
        </div>
      ))}
    </div>
  );
}

export function OutputPanel({ view, onAnswer }: Props) {
  return (
    <section aria-label={TEXTS.outputTitle} className="flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-line bg-panel">
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <h2 className="text-sm font-semibold text-ink">{TEXTS.outputTitle}</h2>
        <div className={`text-xs font-semibold ${STATUS_CLASS[view.status]}`} role="status" aria-live="polite">
          {STATUS_LABELS[view.status]}
        </div>
      </div>
      <div data-testid={TEST_IDS.output} className="flex-1 overflow-auto p-3 font-mono text-sm">
        <Lines view={view} />
        {view.notice !== null && <p className="mt-3 whitespace-pre-wrap text-warn">{view.notice}</p>}
        {view.pendingPrompt !== null && <AskBox prompt={view.pendingPrompt} onAnswer={onAnswer} />}
      </div>
    </section>
  );
}
