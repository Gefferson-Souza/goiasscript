'use client';
import type { ExampleEntry } from '@/lib/examples.types';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { TEXTS } from './ui-texts.constants';

interface Props {
  readonly running: boolean;
  readonly examples: readonly ExampleEntry[];
  readonly shareMessage: string | null;
  readonly onRun: () => void;
  readonly onStop: () => void;
  readonly onClear: () => void;
  readonly onShare: () => void;
  readonly onPickExample: (id: string) => void;
}

const BUTTON = 'rounded px-3 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo';
const SECONDARY = `${BUTTON} border border-goias-borda bg-goias-fundo text-goias-texto hover:bg-goias-fundo/80`;

export function Toolbar({ running, examples, shareMessage, onRun, onStop, onClear, onShare, onPickExample }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-goias-borda bg-goias-painel px-3 py-2">
      <button
        type="button"
        data-testid={TEST_IDS.runButton}
        onClick={onRun}
        disabled={running}
        className={`${BUTTON} bg-goias-verde font-semibold text-white hover:bg-goias-verde/80 disabled:cursor-not-allowed disabled:opacity-50`}
      >
        {running ? TEXTS.running : TEXTS.run}
      </button>
      <button type="button" data-testid={TEST_IDS.stopButton} onClick={onStop} disabled={!running} className={`${SECONDARY} disabled:cursor-not-allowed disabled:opacity-50`}>
        {TEXTS.stop}
      </button>
      <button type="button" onClick={onClear} className={SECONDARY}>
        {TEXTS.clear}
      </button>
      <button type="button" onClick={onShare} className={SECONDARY}>
        {TEXTS.share}
      </button>
      {shareMessage !== null && (
        <span role="status" className="text-xs text-goias-amarelo">
          {shareMessage}
        </span>
      )}

      <div className="ml-auto flex items-center gap-2 text-sm">
        <label htmlFor="seletor-exemplo" className="text-goias-texto/70">
          {TEXTS.examples}
        </label>
        <select
          id="seletor-exemplo"
          value=""
          onChange={(event) => onPickExample(event.target.value)}
          className="rounded border border-goias-borda bg-goias-fundo px-2 py-1 text-sm text-goias-texto focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
        >
          <option value="" disabled>
            {TEXTS.pickExample}
          </option>
          {examples.map((example) => (
            <option key={example.id} value={example.id}>
              {example.title}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
