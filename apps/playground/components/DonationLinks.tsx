'use client';
import { useState } from 'react';

// Chave Pix do projeto. Trocar pela chave real antes do lançamento.
export const PIX_KEY = 'goiasscript@proton.me';
const SPONSORS_URL = 'https://github.com/sponsors/Gefferson-Souza';
const KOFI_URL = 'https://ko-fi.com/goiasscript';

type Props = { variant?: 'compact' | 'full' };

export function DonationLinks({ variant = 'compact' }: Props) {
  const [copiado, setCopiado] = useState(false);

  async function copiarPix() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      /* clipboard indisponível — ignora */
    }
  }

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          type="button"
          onClick={copiarPix}
          className="rounded border border-goias-borda px-2 py-1 text-goias-texto hover:border-goias-amarelo focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
          aria-label={`Copiar chave Pix ${PIX_KEY}`}
        >
          {copiado ? '✅ Pix copiado!' : '💸 Pix'}
        </button>
        <a
          href={SPONSORS_URL}
          target="_blank"
          rel="noreferrer"
          className="text-goias-texto hover:text-goias-amarelo"
        >
          ❤️ Sponsors
        </a>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noreferrer"
          className="text-goias-texto hover:text-goias-amarelo"
        >
          ☕ Ko-fi
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-goias-borda bg-goias-painel p-4">
        <h3 className="font-semibold text-goias-amarelo">💸 Pix (na hora, sem taxa)</h3>
        <p className="mt-1 text-sm text-goias-texto/80">
          Copia a chave e manda quanto o coração mandar, sô.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 rounded bg-goias-fundo px-3 py-2 text-sm text-goias-texto">
            {PIX_KEY}
          </code>
          <button
            type="button"
            onClick={copiarPix}
            className="rounded bg-goias-verde px-3 py-2 text-sm font-semibold text-white hover:bg-goias-verde/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-amarelo"
          >
            {copiado ? '✅ Copiado!' : '📋 Copiar'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <a
          href={SPONSORS_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-goias-borda bg-goias-painel p-4 hover:border-goias-amarelo"
        >
          <h3 className="font-semibold text-goias-amarelo">❤️ GitHub Sponsors</h3>
          <p className="mt-1 text-sm text-goias-texto/80">
            Apoio recorrente, direto do GitHub.
          </p>
        </a>
        <a
          href={KOFI_URL}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-goias-borda bg-goias-painel p-4 hover:border-goias-amarelo"
        >
          <h3 className="font-semibold text-goias-amarelo">☕ Ko-fi</h3>
          <p className="mt-1 text-sm text-goias-texto/80">
            Paga um cafezinho pro projeto seguir moendo.
          </p>
        </a>
      </div>
    </div>
  );
}
