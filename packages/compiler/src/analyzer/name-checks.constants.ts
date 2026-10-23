export const MAX_SUGGESTION_DISTANCE = 2;
export const FRESH_NAME_PREFIX = 'meu_';
// Abaixo disso a varredura direta custa menos do que montar o índice de remoções.
export const LINEAR_SCAN_LIMIT = 48;
// Só o começo do nome entra no índice: limita as chaves por nome; a distância real confere o resto.
export const INDEX_PREFIX_LIMIT = 24;
