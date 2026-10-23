// Frase em goianês que o aluno vê no lugar da mensagem do motor num TypeError.
export const TYPE_ERROR_PHRASE = 'Ô sô, deu erro de tipo: um valor não foi usado do jeito certo.';

export const INFINITE_LOOP_PHRASE = (line: number): string => `Ô sô, esse laço rodou demais (linha ${String(line)}). Será que ele nunca termina?`;

// `erro.mensagem` dentro do programa carrega o texto do motor, que muda por navegador; cada padrão é uma lista fechada
// dessas variações. Erro de sintaxe ou de referência do próprio payload não casa com nenhum, então não vira falso verde.
export const CSP_BLOCK = /unsafe-eval|content[ -]security[ -]policy|\bCSP\b/iu;
export const NETWORK_BLOCK = /failed to fetch|networkerror|load failed|refused to connect|XhrBlocked|SocketBlocked/iu;
export const STORAGE_ABSENT = /localStorage is not defined|can't find variable: localStorage/iu;
// Estouro de pilha vira RangeError (frase de faixa) no Chromium e no WebKit, e InternalError (frase genérica) no Firefox.
export const STACK_EXHAUSTED = /um número ficou fora do que o trem aceita|deu um erro que a gente não conhece/iu;
