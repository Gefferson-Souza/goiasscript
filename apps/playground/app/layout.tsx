import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'GoiásScript — Playground',
  description: 'Escreva goianês no navegador e veja o JavaScript moído na hora.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-goias-borda bg-goias-painel">
          <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-goias-amarelo font-bold">
              <span className="text-2xl">🇧🇷</span>
              <span>GoiásScript</span>
              <span className="text-goias-texto text-sm font-normal">— playground v1.5</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/" className="hover:text-goias-amarelo">Playground</Link>
              <Link href="/engoianador" className="hover:text-goias-amarelo">Engoianador</Link>
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
        <main className="flex-1 flex flex-col">{children}</main>
        <footer className="border-t border-goias-borda bg-goias-painel">
          <div className="mx-auto max-w-7xl px-4 py-3 text-xs text-goias-texto/70 flex items-center justify-between">
            <span>🇧🇷 Feito com carinho em Goiás — MIT</span>
            <span>v1.5.0</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
