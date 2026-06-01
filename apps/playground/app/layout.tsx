import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { DonationLinks } from '@/components/DonationLinks';

const SITE = 'https://playground.goiasscript.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'GoiásScript — Goianês na Web',
    template: '%s — GoiásScript',
  },
  description: 'Escreva goianês no navegador e veja o JavaScript moído na hora.',
  applicationName: 'GoiásScript',
  openGraph: {
    title: 'GoiásScript — Goianês na Web',
    description: 'Escreva goianês no navegador e veja o JavaScript moído na hora.',
    url: SITE,
    siteName: 'GoiásScript',
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GoiásScript — Goianês na Web',
    description: 'Escreva goianês no navegador e veja o JavaScript moído na hora.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-goias-amarelo focus:px-3 focus:py-2 focus:text-goias-fundo"
        >
          Pular pro conteúdo
        </a>
        <header className="border-b border-goias-borda bg-goias-painel">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-goias-amarelo">
              <span className="text-2xl" aria-hidden="true">🐂</span>
              <span>GoiásScript</span>
              <span className="text-sm font-normal text-goias-texto">— playground v1.5</span>
            </Link>
            <nav aria-label="Navegação principal" className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-goias-amarelo">Playground</Link>
              <Link href="/engoianador" className="hover:text-goias-amarelo">Engoianador</Link>
              <Link href="/doacao" className="hover:text-goias-amarelo">Apoia o trem</Link>
              <a
                href="https://github.com/Gefferson-Souza/goiasscript"
                target="_blank"
                rel="noreferrer"
                className="hover:text-goias-amarelo"
              >
                GitHub ↗
              </a>
            </nav>
          </div>
        </header>
        <main id="conteudo" className="flex flex-1 flex-col">
          {children}
        </main>
        <footer className="border-t border-goias-borda bg-goias-painel">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-goias-texto/70 sm:flex-row sm:items-center sm:justify-between">
            <span>🇧🇷 Feito com carinho em Goiás — MIT · v1.5.0</span>
            <DonationLinks variant="compact" />
          </div>
        </footer>
      </body>
    </html>
  );
}
