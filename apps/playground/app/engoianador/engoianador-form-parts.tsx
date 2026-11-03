import { MAX_INPUT_CHARS } from '../../lib/engoianador-client.constants.ts';
import { PRESETS } from './engoianador.constants.ts';
import type { EngoianadorSession } from './engoianador-session.types.ts';

const FOCUS_RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-caret';
const SECONDARY_BUTTON = `rounded border border-edge bg-plane px-4 py-2 text-ink hover:border-caret disabled:opacity-50 ${FOCUS_RING}`;
const PRIMARY_BUTTON = `rounded bg-pequi px-5 py-2 font-semibold text-plane hover:bg-pequi/85 disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING}`;
const PRESET_BUTTON = `rounded-full border border-edge bg-panel px-3 py-1 text-sm text-ink hover:border-caret disabled:opacity-50 ${FOCUS_RING}`;
const PANEL_FIELD = `min-h-[220px] flex-1 resize-y rounded border border-edge bg-panel p-3 font-mono text-sm ${FOCUS_RING}`;

export function PresetBar({ session }: { readonly session: EngoianadorSession }) {
  return (
    <div className="flex flex-wrap justify-center gap-2" aria-label="Exemplos prontos">
      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          disabled={session.loading}
          onClick={() => {
            session.setInput(preset.text);
            void session.run(preset.text);
          }}
          className={PRESET_BUTTON}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

export function TextPanels({ session }: { readonly session: EngoianadorSession }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex flex-col">
        <label htmlFor="entrada" className="mb-1 text-sm text-dim">
          Texto original ({session.input.length}/{MAX_INPUT_CHARS})
        </label>
        <textarea
          id="entrada"
          value={session.input}
          onChange={(event) => {
            session.setInput(event.target.value);
          }}
          placeholder="Olá, tudo bem? Estou aprendendo programação."
          className={`${PANEL_FIELD} text-ink`}
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="saida" className="mb-1 text-sm text-dim">
          Versão engoianada
        </label>
        <textarea
          id="saida"
          value={session.output}
          readOnly
          aria-live="polite"
          placeholder="O resultado em goianês raiz aparece aqui..."
          className={`${PANEL_FIELD} text-pequi`}
        />
      </div>
    </div>
  );
}

export function ActionBar({ session }: { readonly session: EngoianadorSession }) {
  const { input, output, loading } = session;
  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={() => void session.run(input)}
        disabled={loading || input.trim() === ''}
        className={PRIMARY_BUTTON}
      >
        {loading ? 'Engoianando esse trem...' : 'Engoianar esse trem'}
      </button>
      <button type="button" onClick={() => void session.copy()} disabled={output === ''} className={SECONDARY_BUTTON}>
        {session.copied ? 'Copiado!' : 'Copiar'}
      </button>
      <button
        type="button"
        onClick={() => void session.share()}
        disabled={output === '' || session.sharing}
        className={SECONDARY_BUTTON}
      >
        {session.sharing ? 'Gerando...' : 'Compartilhar'}
      </button>
    </div>
  );
}
