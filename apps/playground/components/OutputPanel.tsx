'use client';
import { useState } from 'react';
import type { RunOutcome } from '@/lib/use-runner';

type Tab = 'saida' | 'js' | 'erros';

const TAB_LABELS: Record<Tab, string> = {
  saida: 'Saída',
  js: 'JS gerado',
  erros: 'Erros',
};

export function OutputPanel({ outcome }: { outcome: RunOutcome }) {
  const [tab, setTab] = useState<Tab>('saida');

  const errorMessage =
    outcome.kind === 'compile-error' || outcome.kind === 'runtime-error' ? outcome.message : null;
  const logs = outcome.kind === 'ok' || outcome.kind === 'runtime-error' || outcome.kind === 'timeout'
    ? outcome.logs
    : [];
  const js = outcome.kind === 'ok' || outcome.kind === 'runtime-error' ? outcome.js : '';

  return (
    <div className="flex flex-col h-full bg-goias-painel border border-goias-borda rounded-md overflow-hidden">
      <div className="flex border-b border-goias-borda">
        {(Object.keys(TAB_LABELS) as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm transition-colors ${
              tab === t
                ? 'text-goias-amarelo border-b-2 border-goias-amarelo bg-goias-fundo/40'
                : 'text-goias-texto/70 hover:text-goias-amarelo'
            }`}
          >
            {TAB_LABELS[t]}
            {t === 'erros' && errorMessage ? (
              <span className="ml-2 text-red-400">●</span>
            ) : null}
          </button>
        ))}
        <div className="ml-auto px-3 py-2 text-xs text-goias-texto/60">
          {outcome.kind === 'running' && '⏳ Moendo esse trem...'}
          {outcome.kind === 'idle' && 'Aguardando...'}
          {outcome.kind === 'ok' && '✅ Rodou bonito'}
          {outcome.kind === 'compile-error' && '❌ Deu ruim na tradução'}
          {outcome.kind === 'runtime-error' && '❌ Deu ruim na execução'}
          {outcome.kind === 'timeout' && '⏰ Esse trem travou, sô'}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 font-mono text-sm">
        {tab === 'saida' && <SaidaView outcome={outcome} logs={logs} />}
        {tab === 'js' && <JsView js={js} />}
        {tab === 'erros' && <ErrosView message={errorMessage} />}
      </div>
    </div>
  );
}

function SaidaView({ outcome, logs }: { outcome: RunOutcome; logs: Array<{ level: string; parts: string[] }> }) {
  if (outcome.kind === 'idle') {
    return <p className="text-goias-texto/60">Clica em &quot;Bota pra moer&quot; pra ver o resultado, sô.</p>;
  }
  if (outcome.kind === 'running') {
    return <p className="text-goias-texto/60">Moendo... 🔥</p>;
  }
  if (logs.length === 0 && outcome.kind === 'ok') {
    return <p className="text-goias-texto/60">Rodou, mas num falou nada.</p>;
  }
  return (
    <div className="space-y-1">
      {logs.map((entry, i) => (
        <div
          key={i}
          className={
            entry.level === 'error'
              ? 'text-red-400'
              : entry.level === 'warn'
                ? 'text-yellow-300'
                : 'text-goias-texto'
          }
        >
          <span className="text-goias-texto/40 mr-2">›</span>
          <span className="whitespace-pre-wrap">{entry.parts.join(' ')}</span>
        </div>
      ))}
      {outcome.kind === 'timeout' && (
        <p className="mt-3 text-yellow-300">
          ⏰ Passou de 3 segundos sem terminar. Travou esse trem!
        </p>
      )}
    </div>
  );
}

function JsView({ js }: { js: string }) {
  if (!js) {
    return <p className="text-goias-texto/60">Sem JavaScript pra mostrar ainda.</p>;
  }
  return <pre className="whitespace-pre-wrap text-goias-texto/90 text-xs">{js}</pre>;
}

function ErrosView({ message }: { message: string | null }) {
  if (!message) {
    return <p className="text-goias-texto/60">Nenhum erro até agora, sô!</p>;
  }
  return (
    <div className="text-red-400 whitespace-pre-wrap">
      <strong>❌ Ô rapaz! Deu ruim:</strong>
      <p className="mt-2">{message}</p>
    </div>
  );
}
