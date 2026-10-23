import type { Diagnostic } from '@goiasscript/compiler';
import { HOST_DIAGNOSTIC_CODE } from './host-diagnostics.constants.ts';
import { INITIAL_RUN_VIEW, LINE_ALREADY_IN_MESSAGE, LINE_LABEL, TIMEOUT_NOTICE, TRUNCATION_NOTICE } from './run-state-view.constants.ts';
import type { RunViewAction, RunViewState } from './run-state-view.types.ts';

export { INITIAL_RUN_VIEW };

const LIVE_STATUSES: ReadonlySet<RunViewState['status']> = new Set(['running', 'asking']);

// Erros do próprio playground não têm linha no .gs: o range deles é só um marcador de origem.
const locatedMessage = ({ code, message, range }: Diagnostic): string =>
  code === HOST_DIAGNOSTIC_CODE || LINE_ALREADY_IN_MESSAGE.test(message) ? message : `${LINE_LABEL(range.start.line)}${message}`;

const failureNotice = (diagnostic: Diagnostic): string =>
  diagnostic.help === undefined ? locatedMessage(diagnostic) : `${locatedMessage(diagnostic)}\n${diagnostic.help}`;

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
      return close(state, 'failed', failureNotice(action.diagnostic));
    case 'timeout':
      return close(state, 'timeout', TIMEOUT_NOTICE);
    case 'finished':
      return close(state, 'finished');
    case 'stopped':
      return close(state, 'stopped');
  }
}
