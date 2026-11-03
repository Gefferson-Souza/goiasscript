// Medidas em pixels do cartão; o símbolo usa a grade de 32 do app/icon.svg.
export const MARK_GRID = 32;
export const MARK_SIZE = 48;
export const MARK_RADIUS = 7;
const WORD_LEFT = 5;
const WORD_TOP = 12;
const WORD_WIDTH = 15;
const WORD_HEIGHT = 8;
const WORD_RADIUS = 2;
const CARET_LEFT = 23;
const CARET_TOP = 7;
const CARET_BAR_WIDTH = 3;
const CARET_BAR_HEIGHT = 18;
const CARET_RADIUS = 1;
export const MARK_WORD = { left: WORD_LEFT, top: WORD_TOP, width: WORD_WIDTH, height: WORD_HEIGHT, radius: WORD_RADIUS } as const;
export const MARK_CARET = { left: CARET_LEFT, top: CARET_TOP, width: CARET_BAR_WIDTH, height: CARET_BAR_HEIGHT, radius: CARET_RADIUS } as const;

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const SOCIAL_WIDTH = 1280;
const SOCIAL_HEIGHT = 640;
export const OG_SIZE = { width: OG_WIDTH, height: OG_HEIGHT } as const;
export const SOCIAL_SIZE = { width: SOCIAL_WIDTH, height: SOCIAL_HEIGHT } as const;

export const PAD_Y = 56;
export const PAD_X = 64;
export const HEADER_GAP = 36;
export const WORDMARK_GAP = 16;
export const WORDMARK_FONT = 40;
export const WORDMARK_TRACKING = -0.8;
export const TITLE_FONT = 68;
export const TITLE_LEADING = 1.05;
export const TITLE_TRACKING = -2;

export const PANEL_GAP = 18;
export const PANEL_PAD_Y = 28;
export const PANEL_PAD_X = 36;
export const PANEL_RADIUS = 16;
export const PANEL_BORDER = 2;
export const CARET_WIDTH = 4;
export const CARET_HEIGHT = 40;

export const ROW_GAP = 28;
export const CODE_FONT = 30;
export const LABEL_WIDTH = 170;
export const SMALL_FONT = 22;

export const WEIGHT_REGULAR = 400;
export const WEIGHT_BOLD = 700;
