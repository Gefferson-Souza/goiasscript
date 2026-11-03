import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import { jetbrainsMono, spaceGrotesk } from './fonts';
import { Wordmark } from '@/components/brand/Wordmark';
import { DonationLinks } from '@/components/DonationLinks';
import { currentSiteConfig } from '@/config/current-site-config';
import { resolveDonationLinks } from '@/lib/donation-links';
import { LANGUAGE_VERSION_LABEL } from '@/lib/version-label.constants';
import { HOME_ROUTE, PLAYGROUND_ROUTE } from '@/lib/landing/routes.constants';

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
    <html lang="pt-BR" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen flex flex-col">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-pequi focus:px-3 focus:py-2 focus:text-plane"
        >
          Pular pro conteúdo
        </a>
        <header className="border-b border-line bg-plane">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
            <Link href={HOME_ROUTE} aria-label={`GoiásScript, playground ${LANGUAGE_VERSION_LABEL}`} className="rounded">
              <Wordmark suffix={`playground ${LANGUAGE_VERSION_LABEL}`} />
            </Link>
            <nav aria-label="Navegação principal" className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <Link href={PLAYGROUND_ROUTE} className="hover:text-caret">Playground</Link>
              <Link href="/cartilha" className="hover:text-caret">Cartilha</Link>
              <Link href="/engoianador" className="hover:text-caret">Engoianador</Link>
              <Link href="/doacao" className="hover:text-caret">Apoia o trem</Link>
              <a
                href="https://github.com/Gefferson-Souza/goiasscript"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-caret"
              >
                GitHub<span className="sr-only"> (abre noutra aba)</span>
              </a>
            </nav>
          </div>
        </header>
        <main id="conteudo" className="flex flex-1 flex-col">
          {children}
        </main>
        <footer className="border-t border-line bg-plane">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-dim sm:flex-row sm:items-center sm:justify-between">
            <span>Feito com carinho em Goiás. Licença MIT. GoiásScript {LANGUAGE_VERSION_LABEL}.</span>
            <DonationLinks links={resolveDonationLinks(siteConfig)} variant="compact" />
          </div>
        </footer>
      </body>
    </html>
  );
}
