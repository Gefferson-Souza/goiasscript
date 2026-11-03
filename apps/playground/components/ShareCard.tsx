import { forwardRef } from 'react';
import { SHARE_SITE } from '@/lib/share-image';
import { BrandMark } from './brand/BrandMark';

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
      className="flex flex-col gap-4 bg-plane p-6"
    >
      <div className="flex items-center gap-2">
        <BrandMark size={24} />
        <span className="font-bold text-pequi">Engoianador</span>
        <span className="text-sm text-dim">— GoiásScript</span>
      </div>

      {original && (
        <p className="text-sm text-dim line-clamp-3">“{original}”</p>
      )}

      <div className="rounded-2xl rounded-bl-sm border border-line bg-panel p-4">
        <p className="whitespace-pre-wrap text-lg leading-snug text-pequi">
          {engoianado}
        </p>
      </div>

      <div className="mt-1 flex items-center justify-between text-xs text-dim">
        <span>Feito com carinho em Goiás</span>
        <span>{SHARE_SITE.replace('https://', '')}</span>
      </div>
    </div>
  );
});
