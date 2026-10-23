const KIND_FUNCTION = 1;
const KIND_PROPERTY = 9;
const KIND_KEYWORD = 17;
const KIND_SNIPPET = 28;
const INSERT_AS_SNIPPET = 4;

// Valores de CompletionItemKind e CompletionItemInsertTextRule do Monaco, fixos pela API do editor.
export const COMPLETION_ITEM_KIND = { function: KIND_FUNCTION, property: KIND_PROPERTY, keyword: KIND_KEYWORD, snippet: KIND_SNIPPET } as const;
export const SNIPPET_INSERT_RULE = INSERT_AS_SNIPPET;
export const SNIPPET_DETAIL = 'trecho';
