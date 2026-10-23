export const PRIMER_PATH = '/cartilha';
export const PRIMER_EDITOR_TIMEOUT_MS = 20_000;
export const PRIMER_DONE_TIMEOUT_MS = 20_000;

// Simula navegador com dados de site bloqueados: só ler `localStorage` já lança.
export const BLOCKED_STORAGE_SCRIPT = `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); } });`;
