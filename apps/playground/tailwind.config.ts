import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        goias: {
          green: '#1f7a3d',
          yellow: '#f5c518',
          earth: '#9b6a3e',
          background: '#0d1117',
          panel: '#161b22',
          border: '#30363d',
          text: '#e6edf3',
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
