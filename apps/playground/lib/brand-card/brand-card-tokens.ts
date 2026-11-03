import { COLORS } from '../design/design-tokens.constants.ts';
import type { HeroLine, HeroSegment, HeroSide, SameTone } from '../landing/hero-code.types.ts';
import type { CodeToken } from './brand-card.types.ts';

const TONE_COLORS: Readonly<Record<SameTone, string>> = {
  plain: COLORS.ink,
  string: COLORS.string,
  number: COLORS.number,
};

function segmentToken(segment: HeroSegment, side: HeroSide): CodeToken {
  if (segment.kind === 'same') return { text: segment.text, color: TONE_COLORS[segment.tone], keyword: false };
  return side === 'dialect'
    ? { text: segment.dialect, color: COLORS.pequi, keyword: true }
    : { text: segment.javascript, color: COLORS.cyan, keyword: true };
}

/** Linha da vitrine em fichas coloridas: cada cor diz se a palavra é goianês, JavaScript ou dado. */
export function codeTokens(line: HeroLine, side: HeroSide): readonly CodeToken[] {
  return line.map((segment) => segmentToken(segment, side)).filter((token) => token.text.length > 0);
}
