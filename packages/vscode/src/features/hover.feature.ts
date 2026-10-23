import type { Feature } from '../host/extension-host.types.ts';
import { hoverFor } from '../language/hover-content.ts';
import { wordAt } from '../language/word-at.ts';

export const hoverFeature: Feature = {
  activate: (host) =>
    host.registerHoverProvider({
      provide: ({ line, character }) => {
        const range = wordAt(line, character);
        if (range === null) return null;
        const hover = hoverFor(range.word, host.settings().lessonBaseUrl);
        return hover === null ? null : { markdown: hover.markdown, startCharacter: range.start, endCharacter: range.end };
      },
    }),
};
