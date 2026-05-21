import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        goias: {
          verde: '#1f7a3d',
          amarelo: '#f5c518',
          terra: '#9b6a3e',
          fundo: '#0d1117',
          painel: '#161b22',
          borda: '#30363d',
          texto: '#e6edf3',
        },
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
