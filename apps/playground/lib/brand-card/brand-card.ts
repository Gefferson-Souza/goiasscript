import { createElement, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { HOME_TEXTS } from '../../components/landing/home-texts.constants.ts';
import { COLORS } from '../design/design-tokens.constants.ts';
import { HERO_LINES } from '../landing/hero-code.constants.ts';
import type { HeroSide } from '../landing/hero-code.types.ts';
import { BRAND_CARD_LINE, BRAND_CARD_TEXTS } from './brand-card.constants.ts';
import type { CardSize } from './brand-card.types.ts';
import * as layout from './brand-card-layout.constants.ts';
import { codeTokens } from './brand-card-tokens.ts';

const SANS = 'Space Grotesk';
const MONO = 'JetBrains Mono';

// O gerador de imagem só aceita flexbox: todo bloco com mais de um filho declara display flex.
function box(style: CSSProperties, ...children: readonly ReactNode[]): ReactElement {
  return createElement('div', { style: { display: 'flex', ...style } }, ...children);
}

function text(style: CSSProperties, content: string): ReactElement {
  return createElement('span', { style }, content);
}

function markPart(part: typeof layout.MARK_WORD | typeof layout.MARK_CARET, unit: number, color: string): ReactElement {
  return box({
    position: 'absolute',
    left: part.left * unit,
    top: part.top * unit,
    width: part.width * unit,
    height: part.height * unit,
    borderRadius: part.radius * unit,
    background: color,
  });
}

function brandMark(): ReactElement {
  const unit = layout.MARK_SIZE / layout.MARK_GRID;
  return box(
    { position: 'relative', width: layout.MARK_SIZE, height: layout.MARK_SIZE, borderRadius: layout.MARK_RADIUS * unit, background: COLORS.panel },
    markPart(layout.MARK_WORD, unit, COLORS.pequi),
    markPart(layout.MARK_CARET, unit, COLORS.caret),
  );
}

function wordmark(): ReactElement {
  return box(
    { alignItems: 'center', gap: layout.WORDMARK_GAP, fontFamily: SANS, fontWeight: layout.WEIGHT_BOLD, fontSize: layout.WORDMARK_FONT, letterSpacing: layout.WORDMARK_TRACKING },
    brandMark(),
    box({}, text({ color: COLORS.pequi }, 'Goiás'), text({ color: COLORS.ink }, 'Script')),
  );
}

function title(): ReactElement {
  const sentences = HOME_TEXTS.title.split('. ').map((sentence) => sentence.replace(/\.$/u, ''));
  return box(
    { flexDirection: 'column', fontFamily: SANS, fontWeight: layout.WEIGHT_BOLD, fontSize: layout.TITLE_FONT, lineHeight: layout.TITLE_LEADING, letterSpacing: layout.TITLE_TRACKING, color: COLORS.ink },
    ...sentences.map((sentence) => text({}, `${sentence}.`)),
  );
}

function codeRow(side: HeroSide): ReactElement {
  const isDialect = side === 'dialect';
  const tokens = codeTokens(HERO_LINES[BRAND_CARD_LINE] ?? [], side);
  return box(
    { alignItems: 'center', gap: layout.ROW_GAP, fontFamily: MONO, fontSize: layout.CODE_FONT },
    text(
      { width: layout.LABEL_WIDTH, fontSize: layout.SMALL_FONT, color: isDialect ? COLORS.pequi : COLORS.cyan },
      isDialect ? BRAND_CARD_TEXTS.dialectLabel : BRAND_CARD_TEXTS.javascriptLabel,
    ),
    box(
      { whiteSpace: 'pre' },
      ...tokens.map((token) => text({ color: token.color, fontWeight: token.keyword ? layout.WEIGHT_BOLD : layout.WEIGHT_REGULAR }, token.text)),
    ),
  );
}

function codePanel(): ReactElement {
  return box(
    {
      position: 'relative',
      flexDirection: 'column',
      gap: layout.PANEL_GAP,
      padding: `${String(layout.PANEL_PAD_Y)}px ${String(layout.PANEL_PAD_X)}px`,
      borderRadius: layout.PANEL_RADIUS,
      background: COLORS.panel,
      border: `${String(layout.PANEL_BORDER)}px solid ${COLORS.line}`,
    },
    box({ position: 'absolute', left: 0, top: layout.PANEL_PAD_Y, width: layout.CARET_WIDTH, height: layout.CARET_HEIGHT, background: COLORS.caret }),
    codeRow('dialect'),
    codeRow('javascript'),
  );
}

function footer(): ReactElement {
  return box(
    { justifyContent: 'space-between', fontFamily: MONO, fontSize: layout.SMALL_FONT, color: COLORS.dim },
    text({}, BRAND_CARD_TEXTS.footer),
    text({}, BRAND_CARD_TEXTS.address),
  );
}

/** Cartão da identidade para Open Graph e prévia do GitHub: a mesma linha em goianês e em JavaScript. */
export function brandCardElement(size: CardSize): ReactElement {
  return box(
    {
      width: size.width,
      height: size.height,
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: `${String(layout.PAD_Y)}px ${String(layout.PAD_X)}px`,
      background: COLORS.plane,
    },
    box({ flexDirection: 'column', gap: layout.HEADER_GAP }, wordmark(), title()),
    codePanel(),
    footer(),
  );
}
