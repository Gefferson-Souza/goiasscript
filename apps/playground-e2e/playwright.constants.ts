export const TEST_TIMEOUT_MS = 30_000;
export const SERVER_START_TIMEOUT_MS = 240_000;
export const CI_RETRIES = 1;
export const MONOREPO_ROOT = '../..';
export const BUILD_AND_START = 'corepack pnpm --filter playground build && corepack pnpm --filter playground start';

export const DEFAULT_PORT_ENV = 'PLAYGROUND_E2E_PORT';
export const CONFIGURED_PORT_ENV = 'PLAYGROUND_E2E_CONFIGURED_PORT';
export const CONFIGURED_DIST_DIR = '.next-configured';

// Servidor padrão: só o endereço do site, sem doação nem Engoianador (recursos desligados por ausência de valor).
// Valores fictícios no domínio .test: o build de produção recusa os do .env.example (.invalid).
export const BASE_PUBLIC_ENV = {
  NEXT_PUBLIC_SITE_URL: 'https://playground.test',
} as const;

// Segundo servidor: todos os recursos opcionais ligados.
export const CONFIGURED_PUBLIC_ENV = {
  ...BASE_PUBLIC_ENV,
  NEXT_PUBLIC_ENGOIANADOR_URL: 'https://api.mock.test',
  NEXT_PUBLIC_DONATION_PIX_KEY: 'chave-pix-de-teste',
  NEXT_PUBLIC_DONATION_SPONSORS_URL: 'https://sponsors.mock.test',
  NEXT_PUBLIC_DONATION_KOFI_URL: 'https://kofi.mock.test',
  NEXT_PUBLIC_CONTACT_URL: 'https://contato.mock.test',
} as const;

// Specs escritos só contra o chromium (checam globais do sandbox e seletores antigos); saem desta lista quando forem reescritos para os três navegadores.
export const CHROMIUM_ONLY_SPECS: readonly string[] = [];
