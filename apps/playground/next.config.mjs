/** @type {import('next').NextConfig} */

// CSP é a fronteira de segurança real do playground: mesmo que código do
// usuário escape o escopo do Web Worker, connect-src 'self' impede
// exfiltração e script-src sem origem externa impede importScripts de CDN.
// 'unsafe-eval' é necessário porque o playground executa o JS transpilado
// via new Function e o Monaco usa eval para os web workers de linguagem.
const engoianadorUrl = process.env.NEXT_PUBLIC_ENGOIANADOR_URL || '';
const connectExtra = engoianadorUrl ? ` ${engoianadorUrl}` : '';

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "worker-src 'self' blob:",
  `connect-src 'self'${connectExtra}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['goiasscript'],
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  webpack: (config) => {
    // O entry browser do goiasscript é CommonJS puro sem fs/path; só evitamos
    // que o Webpack tente polyfill de Node built-ins nunca importados.
    config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    return config;
  },
};

export default nextConfig;
