'use client';
import { useState } from 'react';
import { engoianar } from '@/lib/engoianador-client';

const MAX_CHARS = 2000;

export default function EngoianadorPage() {
  const [entrada, setEntrada] = useState('');
  const [saida, setSaida] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function handleEngoianar() {
    setErro(null);
    setSaida('');
    setLoading(true);
    try {
      const out = await engoianar(entrada);
      setSaida(out);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!saida) return;
    await navigator.clipboard.writeText(saida);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  return (
    <div className="mx-auto max-w-5xl w-full px-4 py-8 flex flex-col gap-6">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-goias-amarelo">🪄 Engoianador</h1>
        <p className="text-goias-texto/80 mt-2">
          Cola qualquer texto e o trem devolve em goianês raiz, sô.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-goias-texto/70 mb-1">
            Texto original ({entrada.length}/{MAX_CHARS})
          </label>
          <textarea
            value={entrada}
            onChange={e => setEntrada(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Olá, tudo bem? Estou aprendendo programação."
            className="flex-1 min-h-[260px] bg-goias-painel border border-goias-borda rounded p-3 text-goias-texto font-mono text-sm resize-y"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-goias-texto/70 mb-1">Versão engoianada</label>
          <textarea
            value={saida}
            readOnly
            placeholder="O resultado em goianês raiz aparece aqui..."
            className="flex-1 min-h-[260px] bg-goias-painel border border-goias-borda rounded p-3 text-goias-amarelo font-mono text-sm resize-y"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-center">
        <button
          onClick={handleEngoianar}
          disabled={loading || !entrada.trim()}
          className="px-5 py-2 bg-goias-verde hover:bg-goias-verde/80 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded"
        >
          {loading ? '🌀 Engoianando esse trem...' : '🪄 Engoianar esse trem'}
        </button>
        <button
          onClick={handleCopy}
          disabled={!saida}
          className="px-4 py-2 bg-goias-fundo border border-goias-borda hover:border-goias-amarelo text-goias-texto rounded disabled:opacity-50"
        >
          {copiado ? '✅ Copiado!' : '📋 Copiar'}
        </button>
      </div>

      {erro && (
        <div className="p-3 border border-red-400 bg-red-400/10 text-red-300 rounded text-sm">
          <strong>Ô rapaz! Deu ruim:</strong> {erro}
        </div>
      )}

      <p className="text-xs text-goias-texto/50 text-center">
        Powered by Cloudflare Workers + LLM. Limite: 10 engoianações por minuto, sô.
      </p>
    </div>
  );
}
