import monarch from '@goiasscript/language/generated/goiasscript.monarch.json';
import { completionContextAt, provideCompletions } from './completion-provider.ts';
import { provideHover } from './hover-provider.ts';
import { GOIASSCRIPT_LANGUAGE_ID } from './monaco-assets.ts';
import type { CompletionProviderLike, HoverProviderLike, MonacoLike } from './monaco-api.types.ts';

const COMPLETION_TRIGGER = '.';
const registered = new WeakSet<object>();

const completionProvider: CompletionProviderLike = {
  triggerCharacters: [COMPLETION_TRIGGER],
  provideCompletionItems(model, position) {
    const context = completionContextAt(model.getLineContent(position.lineNumber).slice(0, position.column - 1));
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: position.column - context.prefix.length,
      endColumn: position.column,
    };
    return { suggestions: provideCompletions(context).map((entry) => ({ ...entry, range })) };
  },
};

const hoverProvider: HoverProviderLike = {
  provideHover(model, position) {
    const word = model.getWordAtPosition(position);
    const content = word === null ? null : provideHover(word.word);
    if (word === null || content === null) return null;
    const range = { startLineNumber: position.lineNumber, endLineNumber: position.lineNumber, startColumn: word.startColumn, endColumn: word.endColumn };
    return { range, contents: [content] };
  },
};

export function registerGoiasScript(monaco: MonacoLike): void {
  if (registered.has(monaco)) return;
  registered.add(monaco);
  monaco.languages.register({ id: GOIASSCRIPT_LANGUAGE_ID });
  monaco.languages.setMonarchTokensProvider(GOIASSCRIPT_LANGUAGE_ID, monarch);
  monaco.languages.registerCompletionItemProvider(GOIASSCRIPT_LANGUAGE_ID, completionProvider);
  monaco.languages.registerHoverProvider(GOIASSCRIPT_LANGUAGE_ID, hoverProvider);
}
