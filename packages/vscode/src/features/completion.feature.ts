import { completionItemsFor } from '../language/completion-items.ts';
import type { Feature } from '../host/extension-host.types.ts';

export const completionFeature: Feature = {
  activate: (host) =>
    host.registerCompletionProvider({
      provide: ({ linePrefix }) => completionItemsFor({ linePrefix, lessonBaseUrl: host.settings().lessonBaseUrl }),
    }),
};
