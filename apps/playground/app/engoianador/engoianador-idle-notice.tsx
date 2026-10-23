import { IDLE_NOTICE, RECHECK_LABEL } from './engoianador.constants.ts';

export function EngoianadorIdleNotice({ onRecheck }: { readonly onRecheck?: () => void }) {
  return (
    <div role="status" className="rounded border border-goias-borda bg-goias-painel p-4 text-center">
      <p>{IDLE_NOTICE}. Volta mais tarde que ele já já tá de volta.</p>
      {onRecheck !== undefined && (
        <button
          type="button"
          onClick={onRecheck}
          className="mt-2 rounded border border-goias-borda px-3 py-1 text-sm hover:border-goias-amarelo"
        >
          {RECHECK_LABEL}
        </button>
      )}
    </div>
  );
}
