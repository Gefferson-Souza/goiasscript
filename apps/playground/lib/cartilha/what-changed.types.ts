export type MarkdownPart =
  | { readonly kind: 'prose'; readonly text: string }
  | { readonly kind: 'table'; readonly header: readonly string[]; readonly rows: readonly (readonly string[])[] };
