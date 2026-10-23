import type { SiteConfig } from '../config/site-config.types.ts';
import type { DonationLink } from './donation-links.types.ts';

export function resolveDonationLinks(config: SiteConfig): readonly DonationLink[] {
  const { pixKey, sponsorsUrl, kofiUrl } = config.donation;
  return [
    ...(pixKey === null ? [] : [{ kind: 'pix', label: 'Pix', pixKey } as const]),
    ...(sponsorsUrl === null ? [] : [{ kind: 'sponsors', label: 'GitHub Sponsors', href: sponsorsUrl } as const]),
    ...(kofiUrl === null ? [] : [{ kind: 'kofi', label: 'Ko-fi', href: kofiUrl } as const]),
  ];
}
