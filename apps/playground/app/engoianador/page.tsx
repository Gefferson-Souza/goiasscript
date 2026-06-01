'use client';
import { useRef, useState } from 'react';
import { engoianar } from '@/lib/engoianador-client';
import { ShareCard } from '@/components/ShareCard';
import { nodeToPng, downloadDataUrl, openTwitterIntent } from '@/lib/share';

const MAX_CHARS = 2000;

// Exemplos pré-prontos: clica e já engoiana (zero fricção).
const PRESETS: Array<{ label: string; texto: string }> = [
  {
    label: 'Algoritmo de consenso',
    texto:
      'Explique o que é um algoritmo de consenso em sistemas distribuídos e por que ele é importante.',
  },
  {
    label: 'Programação assíncrona',
    texto: 'Explique o que é programação assíncrona e como o async/await funciona.',
  },
  {
    label: 'Por que Rust é melhor que C',
    texto: 'Explique por que muita gente acha Rust mais seguro que C para programar.',
  },
  {
    label: 'O que é blockchain',
    texto: 'Explique de forma simples o que é uma blockchain e como ela funciona.',
  },
  {
    label: 'TCP vs UDP',
    texto: 'Explique a diferença entre os protocolos TCP e UDP.',
  },
];

export default function EngoianadorPage() {
  const [entrada, setEntrada] = useState('');
  const [saida, setSaida] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [compartilhando, setCompartilhando] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function executar(texto: string) {
    setErro(null);
    setSaida('');
    setLoading(true);
    try {
      const out = await engoianar(texto);
      setSaida(out);
    } catch (e) {
      setErro(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  function handlePreset(p: (typeof PRESETS)[number]) {
    setEntrada(p.texto);
    void executar(p.texto);
  }

  async function handleCopy() {
    if (!saida) return;
    try {
      await navigator.clipboard.writeText(saida);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  }

  async function handleShare() {
    if (!saida || !cardRef.current) return;
    setCompartilhando(true);
    try {
      const dataUrl = await nodeToPng(cardRef.current);
      downloadDataUrl(dataUrl, 'engoianado.png');
      openTwitterIntent('Engoianei um trem aqui ó 🐂👇');
    } catch {
      setErro('Num consegui gerar a imagem, sô. Tenta de novo.');
    } finally {
      setCompartilhando(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-goias-amarelo sm:text-3xl">🪄 Engoianador</h1>
        <p className="mt-2 text-goias-texto/80">
          Cola qualquer texto e o trem devolve em goianês raiz, sô.
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-2" aria-label="Exemplos prontos">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handlePreset(p)}
            disabled={loading}
            className="rounded-full border border-goias-borda bg-goias-painel px-3 py-1 text-sm text-goias-texto hover:border-goias-amarelo disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex flex-col">
          <label htmlFor="entrada" className="mb-1 text-sm text-goias-texto/70">
            Texto original ({entrada.length}/{MAX_CHARS})
          </label>
          <textarea
            id="entrada"
            value={entrada}
            onChange={(e) => setEntrada(e.target.value.slice(0, MAX_CHARS))}
            placeholder="Olá, tudo bem? Estou aprendendo programação."
            className="min-h-[220px] flex-1 resize-y rounded border border-goias-borda bg-goias-painel p-3 font-mono text-sm text-goias-texto focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="saida" className="mb-1 text-sm text-goias-texto/70">
            Versão engoianada
          </label>
          <textarea
            id="saida"
            value={saida}
            readOnly
            aria-live="polite"
            placeholder="O resultado em goianês raiz aparece aqui..."
            className="min-h-[220px] flex-1 resize-y rounded border border-goias-borda bg-goias-painel p-3 font-mono text-sm text-goias-amarelo"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => executar(entrada)}
          disabled={loading || !entrada.trim()}
          className="rounded bg-goias-verde px-5 py-2 font-semibold text-white hover:bg-goias-verde/80 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
        >
          {loading ? '🌀 Engoianando esse trem...' : '🪄 Engoianar esse trem'}
        </button>
        <button
          onClick={handleCopy}
          disabled={!saida}
          className="rounded border border-goias-borda bg-goias-fundo px-4 py-2 text-goias-texto hover:border-goias-amarelo disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
        >
          {copiado ? '✅ Copiado!' : '📋 Copiar'}
        </button>
        <button
          onClick={handleShare}
          disabled={!saida || compartilhando}
          className="rounded border border-goias-borda bg-goias-fundo px-4 py-2 text-goias-texto hover:border-goias-amarelo disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
        >
          {compartilhando ? '📸 Gerando...' : '📸 Compartilhar'}
        </button>
      </div>

      {erro && (
        <div
          role="alert"
          className="rounded border border-red-400 bg-red-400/10 p-3 text-sm text-red-300"
        >
          <strong>Ô rapaz! Deu ruim:</strong> {erro}
        </div>
      )}

      <p className="text-center text-xs text-goias-texto/50">
        Powered by Cloudflare Workers + LLM. Limite: 20 engoianações por dia, sô.{' '}
        <a href="/doacao" className="underline hover:text-goias-amarelo">
          Apoia o trem
        </a>
        .
      </p>

      {/* Card de marca renderizado fora da tela só pra captura do PNG. */}
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden="true">
        <ShareCard ref={cardRef} original={entrada} engoianado={saida} />
      </div>
    </div>
  );
}
