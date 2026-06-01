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
  // Select controlado: volta pro placeholder após carregar, permitindo
  // recarregar o mesmo exemplo (defaultValue ficava preso na seleção).
  const [selecionado, setSelecionado] = useState('');

  useEffect(() => {
    fetch('/examples/manifest.json')
      .then(r => (r.ok ? r.json() : []))
      .then(setExamples)
      .catch(() => setExamples([]));
  }, []);

  async function handlePickExample(arquivo: string) {
    if (!arquivo) return;
    const res = await fetch(`/examples/${arquivo}`);
    if (!res.ok) throw new Error(`Falha ao carregar ${arquivo} (HTTP ${res.status})`);
    const text = await res.text();
    const entry = examples.find(e => e.arquivo === arquivo);
    onLoadExample(text, entry?.nome ?? arquivo);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-goias-borda bg-goias-painel">
      <button
        onClick={onRun}
        disabled={running}
        className="rounded bg-goias-verde px-4 py-1.5 text-sm font-semibold text-white hover:bg-goias-verde/80 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
      >
        {running ? '🔥 Moendo...' : '🔥 Bota pra moer'}
      </button>
      <button
        onClick={onClear}
        className="rounded border border-goias-borda bg-goias-fundo px-3 py-1.5 text-sm text-goias-texto hover:bg-goias-fundo/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
      >
        🧹 Limpa o terreiro
      </button>

      <div className="ml-auto flex items-center gap-2 text-sm">
        <label htmlFor="seletor-exemplo" className="text-goias-texto/70">
          Exemplos:
        </label>
        <select
          id="seletor-exemplo"
          value={selecionado}
          onChange={e => {
            const arquivo = e.target.value;
            setSelecionado(''); // reseta pro placeholder (permite repicar o mesmo)
            if (arquivo) {
              handlePickExample(arquivo).catch(err =>
                console.error('Erro ao carregar exemplo:', err)
              );
            }
          }}
          className="rounded border border-goias-borda bg-goias-fundo px-2 py-1 text-sm text-goias-texto focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
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
