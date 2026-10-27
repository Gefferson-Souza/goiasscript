import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { DonationLinks } from '@/components/DonationLinks';
import { currentSiteConfig } from '@/config/current-site-config';
import { resolveDonationLinks } from '@/lib/donation-links';

const siteConfig = currentSiteConfig();
const { siteUrl } = siteConfig;

export const metadata: Metadata = {
  ...(siteUrl === null ? {} : { metadataBase: new URL(siteUrl) }),
  title: {
    default: 'GoiásScript — Goianês na Web',
    template: '%s — GoiásScript',
  },
  description: 'Escreva goianês no navegador e veja o JavaScript moído na hora.',
  applicationName: 'GoiásScript',
  openGraph: {
    title: 'GoiásScript — Goianês na Web',
    description: 'Escreva goianês no navegador e veja o JavaScript moído na hora.',
    ...(siteUrl === null ? {} : { url: siteUrl }),
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
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-goias-yellow focus:px-3 focus:py-2 focus:text-goias-background"
        >
          Pular pro conteúdo
        </a>
        <header className="border-b border-goias-border bg-goias-panel">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 font-bold text-goias-yellow">
              <span className="text-2xl" aria-hidden="true">🐂</span>
              <span>GoiásScript</span>
              <span className="text-sm font-normal text-goias-text">— playground v1.5</span>
            </Link>
            <nav aria-label="Navegação principal" className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-goias-yellow">Playground</Link>
              <Link href="/cartilha" className="hover:text-goias-yellow">Cartilha</Link>
              <Link href="/engoianador" className="hover:text-goias-yellow">Engoianador</Link>
              <Link href="/doacao" className="hover:text-goias-yellow">Apoia o trem</Link>
              <a
                href="https://github.com/Gefferson-Souza/goiasscript"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-goias-yellow"
              >
                GitHub ↗
              </a>
            </nav>
          </div>
        </header>
        <main id="conteudo" className="flex flex-1 flex-col">
          {children}
        </main>
        <footer className="border-t border-goias-border bg-goias-panel">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-goias-text/70 sm:flex-row sm:items-center sm:justify-between">
            <span>🇧🇷 Feito com carinho em Goiás — MIT · v1.5.0</span>
            <DonationLinks links={resolveDonationLinks(siteConfig)} variant="compact" />
          </div>
        </footer>
      </body>
    </html>
  );
}
