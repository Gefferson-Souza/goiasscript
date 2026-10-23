import type { TruncationReason } from './runner-client.types.ts';
import type { RunViewState } from './run-state-view.types.ts';

export const INITIAL_RUN_VIEW: RunViewState = { status: 'idle', lines: [], pendingPrompt: null, notice: null };

export const TRUNCATION_NOTICE: Readonly<Record<TruncationReason, string>> = {
  lines: 'Ô sô, saiu linha demais! Cortei a saída aqui pra não travar o navegador.',
  chars: 'Ô sô, saiu texto demais! Cortei a saída aqui pra não travar o navegador.',
};

export const TIMEOUT_NOTICE = 'Esse trem travou, sô: passou do tempo e eu parei a execução.';
