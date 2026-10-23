import { MARKER_SEVERITY } from './diagnostic-markers.constants.ts';
import type { EditorMarker } from './diagnostic-markers.types.ts';

export const PLAYGROUND_FILE_NAME = 'programa.gs';

export const OPTIMIZER_UNAVAILABLE_MARKER: EditorMarker = {
  code: 'otimizador',
  severity: MARKER_SEVERITY.warning,
  message: 'Ô sô, o otimizador não carregou. Tô mostrando o JS didático no lugar.',
  startLineNumber: 1,
  startColumn: 1,
  endLineNumber: 1,
  endColumn: 2,
};
