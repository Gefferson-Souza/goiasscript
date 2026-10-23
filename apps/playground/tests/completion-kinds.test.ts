import { CompletionItemInsertTextRule, CompletionItemKind } from 'monaco-editor/esm/vs/editor/common/standalone/standaloneEnums.js';
import { describe, expect, it } from 'vitest';
import { COMPLETION_ITEM_KIND, SNIPPET_INSERT_RULE } from '../lib/monaco/completion-provider.constants.ts';

describe('COMPLETION_ITEM_KIND', () => {
  it('usa os mesmos números do enum do Monaco instalado', () => {
    expect(COMPLETION_ITEM_KIND).toEqual({
      function: CompletionItemKind.Function,
      property: CompletionItemKind.Property,
      keyword: CompletionItemKind.Keyword,
      snippet: CompletionItemKind.Snippet,
    });
  });

  it('insere o trecho com a regra de snippet do Monaco', () => {
    expect(SNIPPET_INSERT_RULE).toBe(CompletionItemInsertTextRule.InsertAsSnippet);
  });
});
