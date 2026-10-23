export const LESSON_ROUTE_PREFIX = '/cartilha/';
export const LESSON_ID_PATTERN = /^[a-z0-9-]+$/u;

// Preenchida à medida que as páginas da cartilha entram no ar.
export const AVAILABLE_LESSONS: readonly string[] = [];

// Toda lição citada pelo catálogo de diagnósticos; o link só aparece quando ela também está em AVAILABLE_LESSONS.
export const KNOWN_LESSON_IDS: readonly string[] = ['licao-02', 'o-que-mudou'];

// Palavra da linguagem → lição que a explica; vazio até a cartilha ter conteúdo por palavra.
export const LESSON_BY_TERM: Readonly<Record<string, string>> = {};
