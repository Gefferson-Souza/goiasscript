'use client';
import { useEffect, useState } from 'react';

type ExampleEntry = { nome: string; arquivo: string };

type Props = {
  running: boolean;
  onRun: () => void;
  onClear: () => void;
  onLoadExample: (code: string, nome: string) => void;
};

export function Toolbar({ running, onRun, onClear, onLoadExample }: Props) {
  const [examples, setExamples] = useState<ExampleEntry[]>([]);

  useEffect(() => {
    fetch('/examples/manifest.json')
      .then(r => (r.ok ? r.json() : []))
      .then(setExamples)
      .catch(() => setExamples([]));
  }, []);

  async function handlePickExample(arquivo: string) {
    if (!arquivo) return;
    const res = await fetch(`/examples/${arquivo}`);
    if (!res.ok) return;
    const text = await res.text();
    const entry = examples.find(e => e.arquivo === arquivo);
    onLoadExample(text, entry?.nome ?? arquivo);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-goias-borda bg-goias-painel">
      <button
        onClick={onRun}
        disabled={running}
        className="px-4 py-1.5 bg-goias-verde hover:bg-goias-verde/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded text-sm"
      >
        {running ? '🔥 Moendo...' : '🔥 Bota pra moer'}
      </button>
      <button
        onClick={onClear}
        className="px-3 py-1.5 bg-goias-fundo hover:bg-goias-fundo/80 border border-goias-borda text-goias-texto rounded text-sm"
      >
        🧹 Limpa o terreiro
      </button>

      <div className="ml-auto flex items-center gap-2 text-sm">
        <label className="text-goias-texto/70">Exemplos:</label>
        <select
          onChange={e => handlePickExample(e.target.value)}
          defaultValue=""
          className="bg-goias-fundo border border-goias-borda text-goias-texto rounded px-2 py-1 text-sm"
        >
          <option value="" disabled>
            Escolhe um, sô
          </option>
          {examples.map(ex => (
            <option key={ex.arquivo} value={ex.arquivo}>
              {ex.nome}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
