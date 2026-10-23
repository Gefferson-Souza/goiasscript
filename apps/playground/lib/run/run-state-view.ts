import { INITIAL_RUN_VIEW, TIMEOUT_NOTICE, TRUNCATION_NOTICE } from './run-state-view.constants.ts';
import type { RunViewAction, RunViewState } from './run-state-view.types.ts';

export { INITIAL_RUN_VIEW };

const LIVE_STATUSES: ReadonlySet<RunViewState['status']> = new Set(['running', 'asking']);

const failureNotice = (message: string, help: string | undefined): string => (help === undefined ? message : `${message}\n${help}`);

const close = (state: RunViewState, status: RunViewState['status'], notice: string | null = state.notice): RunViewState => ({
  ...state,
  status,
  pendingPrompt: null,
  notice,
});

export function reduceRunView(state: RunViewState, action: RunViewAction): RunViewState {
  if (action.kind === 'start') return { ...INITIAL_RUN_VIEW, status: 'running' };
  if (!LIVE_STATUSES.has(state.status)) return state;
  switch (action.kind) {
    case 'out':
    case 'err':
      return { ...state, lines: [...state.lines, { stream: action.kind, text: action.text }] };
    case 'ask':
      return { ...state, status: 'asking', pendingPrompt: action.prompt };
    case 'answer':
      return state.status === 'asking' ? { ...state, status: 'running', pendingPrompt: null } : state;
    case 'truncated':
      return { ...state, notice: TRUNCATION_NOTICE[action.reason] };
    case 'failed':
      return close(state, 'failed', failureNotice(action.diagnostic.message, action.diagnostic.help));
    case 'timeout':
      return close(state, 'timeout', TIMEOUT_NOTICE);
    case 'finished':
      return close(state, 'finished');
    case 'stopped':
      return close(state, 'stopped');
  }
}
