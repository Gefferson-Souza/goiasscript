export const PAGE_SOURCE = '/:path*';
export const SANDBOX_SOURCE = '/sandbox/:path*';

export const SANDBOX_CSP = "default-src 'none'; script-src 'self' blob:; worker-src blob:; connect-src 'none'; img-src 'none'";

// O Next injeta scripts inline sem nonce e o Tailwind/Monaco injetam estilo inline.
export const PAGE_CSP_DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
] as const;

export const HARDENING_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
] as const;

export const SANDBOX_EXTRA_HEADERS = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
] as const;
