declare module 'monaco-editor/esm/vs/editor/common/standalone/standaloneEnums.js' {
  const completionItemKind: Readonly<Record<'Function' | 'Property' | 'Keyword' | 'Snippet', number>>;
  const completionItemInsertTextRule: Readonly<Record<'InsertAsSnippet', number>>;
  export { completionItemKind as CompletionItemKind, completionItemInsertTextRule as CompletionItemInsertTextRule };
}
