import type { Metadata } from 'next';
import { DonationLinks } from '@/components/DonationLinks';
import { currentSiteConfig } from '@/config/current-site-config';
import { resolveDonationLinks } from '@/lib/donation-links';

export const metadata: Metadata = {
  title: 'Apoia o trem',
  description: 'GoiásScript é grátis e roda em free tier. Se curtiu, ajuda a manter o trem moendo.',
};

export default function DonationPage() {
  const links = resolveDonationLinks(currentSiteConfig());
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <header className="text-center">
        <h1 className="text-3xl font-bold text-goias-amarelo">🐂 Apoia o trem, sô!</h1>
        <p className="mx-auto mt-3 max-w-xl text-goias-texto/80">
          {links.length === 0
            ? 'O GoiásScript é de graça, sô. Por enquanto não tem jeito de apoiar configurado, mas usa à vontade e espalha pros amigo.'
            : 'Ajuda o Playground a continuar de pé, sô. Sua doação paga o cafezinho, segura a conta quando viralizar e mantém tudo no ar pra geral.'}
        </p>
      </header>

      {links.length === 0 ? null : (
        <section className="mt-8" aria-label="Formas de apoiar">
          <DonationLinks links={links} variant="full" />
        </section>
      )}

      <p className="mt-8 text-center text-sm text-goias-texto/60">
        Sem doação também tá tranquilo, sô — usa à vontade e espalha pros amigo. Bão demais ocê ter chegado até aqui. 💛
      </p>
    </div>
  );
}
