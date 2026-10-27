import { EngoianadorForm } from './engoianador-form.tsx';
import { EngoianadorIdleNotice } from './engoianador-idle-notice.tsx';

interface EngoianadorScreenProps {
  readonly engoianadorUrl: string | null;
}

export function EngoianadorScreen({ engoianadorUrl }: EngoianadorScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-goias-yellow sm:text-3xl">🪄 Engoianador</h1>
        <p className="mt-2 text-goias-text/80">Cola qualquer texto e o trem devolve em goianês raiz, sô.</p>
      </header>
      {engoianadorUrl === null ? (
        <EngoianadorIdleNotice />
      ) : (
        <EngoianadorForm engoianadorUrl={engoianadorUrl} />
      )}
    </div>
  );
}
