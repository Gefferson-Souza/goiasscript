export const MAX_MARKERS = 200;

const MONACO_SEVERITY_ERROR = 8;
const MONACO_SEVERITY_WARNING = 4;

// Valores de MarkerSeverity do Monaco, fixos pela API do editor.
export const MARKER_SEVERITY = { error: MONACO_SEVERITY_ERROR, warning: MONACO_SEVERITY_WARNING } as const;
