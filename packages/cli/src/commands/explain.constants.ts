export const EXPLAIN_CODE_PATTERN = /^(?:gs)?(\d{4})$/iu;
export const CODE_PREFIX = 'GS';
export const MAX_CODE_SUGGESTION_DISTANCE = 1;
export const CODE_COLUMN_GAP = '  ';
export const EXAMPLE_INDENT = '  ';

export const EXPLAIN_HEADINGS = {
  example: 'Exemplo:',
  lesson: 'Lição:',
} as const;

export const NO_LESSON_FALLBACK = 'sem lição específica, dá uma olhada na cartilha geral.';

export const EXPLAIN_LISTING_HINT = {
  root: 'Pra ver um por um, roda "goiasscript explica GS0301", por exemplo.',
  neutral: 'Para ver um deles, use "goiasscript explica GS0301", por exemplo.',
} as const;

export const UNKNOWN_CODE_DETAIL = {
  root: (typed: string): string => `Não achei o código "${typed}" no catálogo. Roda "goiasscript explica" sem nada pra ver a lista.`,
  neutral: (typed: string): string => `O código "${typed}" não existe no catálogo. Use "goiasscript explica" sem argumento para listar.`,
} as const;

export const CODE_SUGGESTION = {
  root: (code: string): string => `Cê quis dizer "${code}"?`,
  neutral: (code: string): string => `Você quis dizer "${code}"?`,
} as const;
