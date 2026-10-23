import { readSiteConfig } from './site-config.ts';
import type { BuildMode, SiteConfig } from './site-config.types.ts';

// Só vale em componente de servidor: o navegador não recebe process.env dinâmico.
export function currentSiteConfig(): SiteConfig {
  const mode: BuildMode = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  return readSiteConfig(process.env, mode);
}
