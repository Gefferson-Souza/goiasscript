import type { NextConfig } from 'next';
import { buildSecurityHeaders } from './config/security-headers.ts';
import { readSiteConfig } from './config/site-config.ts';
import type { BuildMode } from './config/site-config.types.ts';

const mode: BuildMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
const siteConfig = readSiteConfig(process.env, mode);

// O E2E sobe um segundo build com outras variáveis públicas; ele precisa de uma pasta de saída própria.
const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? '.next',
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@goiasscript/compiler', '@goiasscript/language', '@goiasscript/optimizer'],
  headers: () => Promise.resolve(buildSecurityHeaders(siteConfig, mode).map((rule) => ({ ...rule, headers: [...rule.headers] }))),
};

export default nextConfig;
