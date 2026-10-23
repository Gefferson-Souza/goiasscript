export const ENV_NAMES = {
  siteUrl: 'NEXT_PUBLIC_SITE_URL',
  engoianadorUrl: 'NEXT_PUBLIC_ENGOIANADOR_URL',
  pixKey: 'NEXT_PUBLIC_DONATION_PIX_KEY',
  sponsorsUrl: 'NEXT_PUBLIC_DONATION_SPONSORS_URL',
  kofiUrl: 'NEXT_PUBLIC_DONATION_KOFI_URL',
  contactUrl: 'NEXT_PUBLIC_CONTACT_URL',
} as const;

export const PUBLIC_ENV_PLACEHOLDERS: Readonly<Record<string, string>> = {
  [ENV_NAMES.siteUrl]: 'https://site.invalid',
  [ENV_NAMES.engoianadorUrl]: 'https://engoianador.invalid',
  [ENV_NAMES.pixKey]: 'COLE_A_CHAVE_PIX_AQUI',
  [ENV_NAMES.sponsorsUrl]: 'https://sponsors.invalid',
  [ENV_NAMES.kofiUrl]: 'https://kofi.invalid',
  [ENV_NAMES.contactUrl]: 'https://contato.invalid',
};

export const MAX_PIX_KEY_LENGTH = 140;
export const MAX_URL_LENGTH = 2_048;

export const ALLOWED_PROTOCOLS = {
  production: ['https:'],
  development: ['https:', 'http:'],
} as const;
