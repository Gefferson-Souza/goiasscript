import { IDLE_NOTICE } from './engoianador.constants.ts';

export function EngoianadorIdleNotice() {
  return (
    <p role="status" className="rounded border border-goias-borda bg-goias-painel p-4 text-center">
      {IDLE_NOTICE}. Volta mais tarde que ele já já tá de volta.
    </p>
  );
}
