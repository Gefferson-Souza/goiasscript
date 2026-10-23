import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { DonationLinks } from '../components/DonationLinks.tsx';
import type { SiteConfig } from '../config/site-config.types.ts';
import { resolveDonationLinks } from '../lib/donation-links.ts';

const EMPTY: SiteConfig = {
  siteUrl: null,
  engoianadorUrl: null,
  donation: { pixKey: null, sponsorsUrl: null, kofiUrl: null },
  contactUrl: null,
};

const withDonation = (donation: Partial<SiteConfig['donation']>): SiteConfig => ({
  ...EMPTY,
  donation: { ...EMPTY.donation, ...donation },
});

const PIX_KEY = 'chave-pix-de-teste';
const SPONSORS_URL = 'https://github.com/sponsors/alguem';
const KOFI_URL = 'https://ko-fi.com/alguem';

describe('resolveDonationLinks', () => {
  it('config sem nada devolve lista vazia', () => {
    expect(resolveDonationLinks(EMPTY)).toEqual([]);
  });

  it('só com sponsorsUrl devolve um item', () => {
    const links = resolveDonationLinks(withDonation({ sponsorsUrl: SPONSORS_URL }));
    expect(links).toHaveLength(1);
    expect(links[0]).toMatchObject({ kind: 'sponsors', href: SPONSORS_URL });
  });

  it('a chave Pix vira texto copiável e não link', () => {
    const [pix] = resolveDonationLinks(withDonation({ pixKey: PIX_KEY }));
    expect(pix).toMatchObject({ kind: 'pix', pixKey: PIX_KEY });
    expect(pix).not.toHaveProperty('href');
  });

  it('mantém a ordem fixa Pix, Sponsors, Ko-fi', () => {
    const links = resolveDonationLinks(
      withDonation({ kofiUrl: KOFI_URL, sponsorsUrl: SPONSORS_URL, pixKey: PIX_KEY }),
    );
    expect(links.map((link) => link.kind)).toEqual(['pix', 'sponsors', 'kofi']);
  });
});

describe('DonationLinks', () => {
  it.each(['compact', 'full'] as const)('sem link configurado (%s) não renderiza <a, botão nem chave', (variant) => {
    const html = renderToStaticMarkup(createElement(DonationLinks, { links: [], variant }));
    expect(html).not.toContain('<a');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<code');
  });

  it.each(['compact', 'full'] as const)('com links (%s) todo link externo leva noopener noreferrer e _blank', (variant) => {
    const links = resolveDonationLinks(
      withDonation({ sponsorsUrl: SPONSORS_URL, kofiUrl: KOFI_URL, pixKey: PIX_KEY }),
    );
    const html = renderToStaticMarkup(createElement(DonationLinks, { links, variant }));
    const anchors = html.match(/<a [^>]*>/gu) ?? [];
    expect(anchors).toHaveLength(2);
    for (const anchor of anchors) {
      expect(anchor).toContain('rel="noopener noreferrer"');
      expect(anchor).toContain('target="_blank"');
    }
  });

  it('a chave Pix aparece como texto e nunca como href', () => {
    const links = resolveDonationLinks(withDonation({ pixKey: PIX_KEY }));
    const html = renderToStaticMarkup(createElement(DonationLinks, { links, variant: 'full' }));
    expect(html).toContain(PIX_KEY);
    expect(html).not.toContain('<a');
  });
});
