import { IDLE_NOTICE } from './engoianador.constants.ts';
import { EngoianadorForm } from './engoianador-form.tsx';

interface EngoianadorScreenProps {
  readonly engoianadorUrl: string | null;
}

export function EngoianadorScreen({ engoianadorUrl }: EngoianadorScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-goias-amarelo sm:text-3xl">🪄 Engoianador</h1>
        <p className="mt-2 text-goias-texto/80">Cola qualquer texto e o trem devolve em goianês raiz, sô.</p>
      </header>
      {engoianadorUrl === null ? (
        <p role="status" className="rounded border border-goias-borda bg-goias-painel p-4 text-center">
          {IDLE_NOTICE}. Volta mais tarde que ele já já tá de volta.
        </p>
      ) : (
        <EngoianadorForm engoianadorUrl={engoianadorUrl} />
      )}
    </div>
  );
}
