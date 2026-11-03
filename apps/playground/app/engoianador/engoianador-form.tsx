'use client';
import { ShareCard } from '@/components/ShareCard';
import { PRIVACY_NOTICE } from './engoianador.constants.ts';
import { EngoianadorIdleNotice } from './engoianador-idle-notice.tsx';
import { ActionBar, PresetBar, TextPanels } from './engoianador-form-parts.tsx';
import { useEngoianadorHealth } from './use-engoianador-health.ts';
import { useEngoianadorSession } from './use-engoianador-session.ts';

export function EngoianadorForm({ engoianadorUrl }: { readonly engoianadorUrl: string }) {
  const session = useEngoianadorSession(engoianadorUrl);
  const { health, recheck } = useEngoianadorHealth(engoianadorUrl);

  return (
    <>
      {health === 'down' && <EngoianadorIdleNotice onRecheck={recheck} />}
      <PresetBar session={session} />
      <TextPanels session={session} />
      <ActionBar session={session} />
      <p role="note" className="text-center text-xs text-dim">
        {PRIVACY_NOTICE}
      </p>
      {session.errorMessage !== null && (
        <div role="alert" className="rounded border border-error bg-error/10 p-3 text-sm text-ink">
          {session.errorMessage}
        </div>
      )}
      <p className="text-center text-xs text-dim">
        <a href="/doacao" className="underline hover:text-caret">
          Apoia o trem
        </a>
      </p>
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden="true">
        <ShareCard ref={session.cardRef} original={session.input} engoianado={session.output} />
      </div>
    </>
  );
}
