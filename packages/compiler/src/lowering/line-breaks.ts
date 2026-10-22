const NON_LINE_BREAK = /[^\r\n]/gu;

// Texto que substitui um trecho sem mudar a contagem de linhas do que vem depois.
export const lineBreaksOf = (original: string): string => original.replace(NON_LINE_BREAK, '');
