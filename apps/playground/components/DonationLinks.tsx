'use client';
import { useState } from 'react';
import type { DonationLink, ExternalDonation, PixDonation } from '@/lib/donation-links.types';

const COPIED_FEEDBACK_MS = 1_800;
const EXTERNAL_REL = 'noopener noreferrer';

interface DonationLinksProps {
  readonly links: readonly DonationLink[];
  readonly variant?: 'compact' | 'full';
}

const isPix = (link: DonationLink): link is PixDonation => link.kind === 'pix';
const isExternal = (link: DonationLink): link is ExternalDonation => !isPix(link);

const EXTERNAL_BLURB: Readonly<Record<ExternalDonation['kind'], string>> = {
  sponsors: 'Apoio recorrente, direto do GitHub.',
  kofi: 'Paga um cafezinho pro projeto seguir moendo.',
};

function useCopyFeedback(text: string): { readonly copied: boolean; readonly copy: () => Promise<void> } {
  const [copied, setCopied] = useState(false);
  const copy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, COPIED_FEEDBACK_MS);
    } catch {
      return;
    }
  };
  return { copied, copy };
}

function PixCompact({ pix }: { readonly pix: PixDonation }) {
  const { copied, copy } = useCopyFeedback(pix.pixKey);
  return (
    <button
      type="button"
      onClick={() => void copy()}
      className="rounded border border-goias-border px-2 py-1 text-goias-text hover:border-goias-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-yellow"
      aria-label="Copiar a chave Pix"
    >
      {copied ? '✅ Pix copiado!' : '💸 Pix'}
    </button>
  );
}

function PixFull({ pix }: { readonly pix: PixDonation }) {
  const { copied, copy } = useCopyFeedback(pix.pixKey);
  return (
    <div className="rounded-lg border border-goias-border bg-goias-panel p-4">
      <h3 className="font-semibold text-goias-yellow">💸 Pix (na hora, sem taxa)</h3>
      <p className="mt-1 text-sm text-goias-text/80">Copia a chave e manda quanto o coração mandar, sô.</p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 break-all rounded bg-goias-background px-3 py-2 text-sm text-goias-text">{pix.pixKey}</code>
        <button
          type="button"
          onClick={() => void copy()}
          className="rounded bg-goias-green px-3 py-2 text-sm font-semibold text-white hover:bg-goias-green/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-goias-yellow"
        >
          {copied ? '✅ Copiado!' : '📋 Copiar'}
        </button>
      </div>
    </div>
  );
}

function ExternalCompact({ link }: { readonly link: ExternalDonation }) {
  return (
    <a href={link.href} target="_blank" rel={EXTERNAL_REL} className="text-goias-text hover:text-goias-yellow">
      {link.label}
    </a>
  );
}

function ExternalFull({ link }: { readonly link: ExternalDonation }) {
  return (
    <a
      href={link.href}
      target="_blank"
      rel={EXTERNAL_REL}
      className="rounded-lg border border-goias-border bg-goias-panel p-4 hover:border-goias-yellow"
    >
      <h3 className="font-semibold text-goias-yellow">{link.label}</h3>
      <p className="mt-1 text-sm text-goias-text/80">{EXTERNAL_BLURB[link.kind]}</p>
    </a>
  );
}

export function DonationLinks({ links, variant = 'compact' }: DonationLinksProps) {
  if (links.length === 0) return null;
  const pix = links.find(isPix);
  const externals = links.filter(isExternal);

  if (variant === 'compact') {
    return (
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {pix === undefined ? null : <PixCompact pix={pix} />}
        {externals.map((link) => (
          <ExternalCompact key={link.kind} link={link} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pix === undefined ? null : <PixFull pix={pix} />}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {externals.map((link) => (
          <ExternalFull key={link.kind} link={link} />
        ))}
      </div>
    </div>
  );
}
