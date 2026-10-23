export const PRIMER_PATH = '/cartilha';
export const PRIMER_EDITOR_TIMEOUT_MS = 20_000;
export const PRIMER_DONE_TIMEOUT_MS = 20_000;

// Simula navegador com dados de site bloqueados: só ler `localStorage` já lança.
export const BLOCKED_STORAGE_SCRIPT = `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); } });`;

export const LESSON_ELEVEN_SOLUTION = 'uai preço é vira_número(pergunta("Quanto custa?"))\nprosa("Preço:", preço, "Frete:", 1000.50)';
export const LESSON_ELEVEN_EXPECTED_OUTPUT = 'Quanto custa? Preço: 10.5 Frete: 1000.5';
