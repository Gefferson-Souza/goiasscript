import { readSiteConfig } from './site-config.ts';
import type { BuildMode, SiteConfig } from './site-config.types.ts';

export function loadSiteConfig(): SiteConfig {
  const mode: BuildMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return readSiteConfig(process.env, mode);
}
