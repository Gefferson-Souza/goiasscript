import { forwardRef } from 'react';
import { SHARE_SITE } from '@/lib/share';

type Props = { original: string; engoianado: string };

/**
 * Card de marca renderizado fora da tela e capturado como PNG pelo botão
 * "Compartilhar". Layout fixo (1200x630-ish ao 2x) com branding no rodapé.
 */
export const ShareCard = forwardRef<HTMLDivElement, Props>(function ShareCard(
  { original, engoianado },
  ref
) {
  return (
    <div
      ref={ref}
      style={{ width: 600 }}
      className="flex flex-col gap-4 bg-goias-fundo p-6"
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl">🐂</span>
        <span className="font-bold text-goias-amarelo">Engoianador</span>
        <span className="text-sm text-goias-texto/60">— GoiásScript</span>
      </div>

      {original && (
        <p className="text-sm text-goias-texto/60 line-clamp-3">“{original}”</p>
      )}

      <div className="rounded-2xl rounded-bl-sm border border-goias-borda bg-goias-painel p-4">
        <p className="whitespace-pre-wrap text-lg leading-snug text-goias-amarelo">
          {engoianado}
        </p>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-goias-texto/50">
        <span>🇧🇷 Feito com carinho em Goiás</span>
        <span>{SHARE_SITE.replace('https://', '')}</span>
      </div>
    </div>
  );
});
