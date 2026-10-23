'use client';
import { useState, type FormEvent } from 'react';
import { TEST_IDS } from '@/lib/test-ids.constants';
import { TEXTS } from './ui-texts.constants';

interface Props {
  readonly prompt: string;
  readonly onAnswer: (value: string) => void;
}

export function AskBox({ prompt, onAnswer }: Props) {
  const [value, setValue] = useState('');

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onAnswer(value);
    setValue('');
  };

  return (
    <form onSubmit={submit} data-testid={TEST_IDS.askBox} className="mt-3 space-y-2 rounded border border-goias-amarelo/60 p-3">
      <label htmlFor="ask-input" className="block whitespace-pre-wrap text-goias-amarelo">
        {prompt}
      </label>
      <div className="flex gap-2">
        <input
          id="ask-input"
          data-testid={TEST_IDS.askInput}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoFocus
          autoComplete="off"
          aria-label={TEXTS.askLabel}
          className="flex-1 rounded border border-goias-borda bg-goias-fundo px-2 py-1 text-goias-texto focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
        />
        <button type="submit" className="rounded bg-goias-verde px-3 py-1 text-sm font-semibold text-white hover:bg-goias-verde/80">
          {TEXTS.askAnswer}
        </button>
      </div>
    </form>
  );
}
