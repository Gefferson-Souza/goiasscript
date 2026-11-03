import localFont from 'next/font/local';

// Fontes servidas pelo próprio domínio (a CSP não aceita CDN). Licença OFL ao lado dos arquivos.
export const spaceGrotesk = localFont({
  src: [
    { path: './fonts/space-grotesk-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/space-grotesk-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-space-grotesk',
  display: 'swap',
  fallback: ['system-ui', 'sans-serif'],
});

export const jetbrainsMono = localFont({
  src: [
    { path: './fonts/jetbrains-mono-latin-400-normal.woff2', weight: '400', style: 'normal' },
    { path: './fonts/jetbrains-mono-latin-700-normal.woff2', weight: '700', style: 'normal' },
  ],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  preload: false,
  fallback: ['ui-monospace', 'monospace'],
});
