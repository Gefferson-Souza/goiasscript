export const TEST_TIMEOUT_MS = 30_000;
export const SERVER_START_TIMEOUT_MS = 240_000;
export const CI_RETRIES = 1;
export const MONOREPO_ROOT = '../..';
export const BUILD_AND_START = 'corepack pnpm --filter playground build && corepack pnpm --filter playground start';

// Valores fictícios no domínio .test: o build de produção recusa os do .env.example (.invalid).
export const TEST_PUBLIC_ENV = {
  NEXT_PUBLIC_SITE_URL: 'https://playground.test',
  NEXT_PUBLIC_ENGOIANADOR_URL: 'https://api.mock.test',
  NEXT_PUBLIC_DONATION_PIX_KEY: 'chave-pix-de-teste',
  NEXT_PUBLIC_DONATION_SPONSORS_URL: 'https://sponsors.mock.test',
  NEXT_PUBLIC_DONATION_KOFI_URL: 'https://kofi.mock.test',
  NEXT_PUBLIC_CONTACT_URL: 'https://contato.mock.test',
} as const;
