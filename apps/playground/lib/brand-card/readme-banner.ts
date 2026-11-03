import { HOME_TEXTS } from '../../components/landing/home-texts.constants.ts';
import { COLORS, MOTION } from '../design/design-tokens.constants.ts';
import { HERO_LINES } from '../landing/hero-code.constants.ts';
import type { HeroLine } from '../landing/hero-code.types.ts';
import { BRAND_CARD_LINE, BRAND_CARD_TEXTS } from './brand-card.constants.ts';
import * as banner from './readme-banner.constants.ts';
import { bannerFrames } from './readme-banner-frames.ts';
import type { AnimatedText, BannerFonts, BannerFrames, Keyframe } from './readme-banner.types.ts';

const CHAR_PX = banner.CODE_FONT * banner.MONO_ADVANCE;
const LAST_STATE_OFFSET = 1;

const escapeXml = (text: string): string =>
  text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const percent = (seconds: number): string => `${((seconds / banner.CYCLE_SECONDS) * banner.PERCENT).toFixed(banner.PERCENT_DIGITS)}%`;
const transform = (frame: Keyframe): string => `transform:translate(${String(frame.column * CHAR_PX)}px,0) scale(1,${String(frame.scale)})`;

// Quadros de um elemento: segura o estado, e em cada virada passa pelo meio em ~FLIP_SECONDS.
function keyframesFor(frames: BannerFrames, valueAt: (state: number) => Omit<Keyframe, 'atSeconds'>): readonly Keyframe[] {
  const steps = frames.events.flatMap((event, index) => {
    const before = valueAt(index);
    const after = valueAt(index + LAST_STATE_OFFSET);
    const middle = { column: (before.column + after.column) * banner.HALF, scale: Math.min(before.scale, after.scale) };
    return [
      { atSeconds: event.atSeconds, ...before },
      { atSeconds: event.atSeconds + banner.FLIP_SECONDS * banner.HALF, ...middle },
      { atSeconds: event.atSeconds + banner.FLIP_SECONDS, ...after },
    ];
  });
  return [{ atSeconds: 0, ...valueAt(0) }, ...steps, { atSeconds: banner.CYCLE_SECONDS, ...valueAt(frames.events.length) }];
}

function codeElements(line: HeroLine, frames: BannerFrames): readonly AnimatedText[] {
  return line.flatMap<AnimatedText>((segment, index) => {
    const column = (state: number): number => frames.columnsAt(state)[index] ?? 0;
    if (segment.kind === 'same') {
      const color = segment.tone === 'string' ? COLORS.string : segment.tone === 'number' ? COLORS.number : COLORS.ink;
      return [{ text: segment.text, color, bold: false, keyframes: keyframesFor(frames, (state) => ({ column: column(state), scale: 1 })) }];
    }
    const shown = (state: number, javascript: boolean): number => ((frames.flippedAt(state)[index] ?? false) === javascript ? 1 : 0);
    const sides = [
      { text: segment.dialect, color: COLORS.pequi, javascript: false },
      { text: segment.javascript, color: COLORS.cyan, javascript: true },
    ].filter((side) => side.text.length > 0);
    return sides.map((side) => ({
      text: side.text,
      color: side.color,
      bold: true,
      keyframes: keyframesFor(frames, (state) => ({ column: column(state), scale: shown(state, side.javascript) })),
    }));
  });
}

function labelElements(frames: BannerFrames): readonly AnimatedText[] {
  const half = frames.events.length * banner.HALF;
  const inJavaScript = (state: number): boolean => state > 0 && state <= half;
  return [
    { text: BRAND_CARD_TEXTS.dialectLabel, color: COLORS.pequi, javascript: false },
    { text: BRAND_CARD_TEXTS.javascriptLabel, color: COLORS.cyan, javascript: true },
  ].map((label) => ({
    text: label.text,
    color: label.color,
    bold: false,
    keyframes: keyframesFor(frames, (state) => ({ column: 0, scale: inJavaScript(state) === label.javascript ? 1 : 0 })),
  }));
}

function animationCss(name: string, keyframes: readonly Keyframe[]): string {
  const [first] = keyframes;
  const steps = keyframes.map((frame) => `${percent(frame.atSeconds)}{${transform(frame)}}`).join('');
  const timing = `${String(banner.CYCLE_SECONDS)}s ${MOTION.curves.travel} infinite`;
  return `.${name}{transform-box:fill-box;transform-origin:center;${first === undefined ? '' : transform(first)};animation:${name} ${timing}}@keyframes ${name}{${steps}}`;
}

function fontCss(fonts: BannerFonts): string {
  const face = (family: string, weight: number, data: string): string =>
    `@font-face{font-family:'${family}';font-weight:${String(weight)};src:url(data:font/woff2;base64,${data}) format('woff2')}`;
  return [face('GS Sans', banner.WEIGHT_BOLD, fonts.sansBold), face('GS Mono', banner.WEIGHT_REGULAR, fonts.monoRegular), face('GS Mono', banner.WEIGHT_BOLD, fonts.monoBold)].join('');
}

// O cursor para logo depois da palavra que acabou de virar, sem cobrir letra nenhuma.
function caretElement(frames: BannerFrames): AnimatedText {
  const keyframes = keyframesFor(frames, (state) => {
    const event = frames.events[state - LAST_STATE_OFFSET];
    if (event === undefined) return { column: banner.CARET_START_COLUMN, scale: 1 };
    const columns = frames.columnsAt(state);
    return { column: columns[event.segment + LAST_STATE_OFFSET] ?? frames.textAt(state).length, scale: 1 };
  });
  return { text: '', color: COLORS.caret, bold: false, keyframes };
}

function staticMarkup(): string {
  const unit = banner.MARK_SIZE / banner.MARK_GRID;
  const mark = `<g transform="translate(${String(banner.PAD_X)} ${String(banner.MARK_Y)}) scale(${String(unit)})"><rect width="32" height="32" rx="7" fill="${COLORS.panel}"/><rect x="5" y="12" width="15" height="8" rx="2" fill="${COLORS.pequi}"/><rect x="23" y="7" width="3" height="18" rx="1" fill="${COLORS.caret}"/></g>`;
  const wordmark = `<text x="${String(banner.WORDMARK_X)}" y="${String(banner.WORDMARK_Y)}" font-family="GS Sans" font-weight="700" font-size="${String(banner.WORDMARK_FONT)}" letter-spacing="-1"><tspan fill="${COLORS.pequi}">Goiás</tspan><tspan fill="${COLORS.ink}">Script</tspan></text>`;
  const title = `<text x="${String(banner.PAD_X)}" y="${String(banner.TITLE_Y)}" font-family="GS Sans" font-weight="700" font-size="${String(banner.TITLE_FONT)}" fill="${COLORS.dim}">${escapeXml(HOME_TEXTS.title)}</text>`;
  const panelWidth = banner.BANNER_WIDTH - banner.PAD_X - banner.PAD_X;
  const panel = `<rect x="${String(banner.PAD_X)}" y="${String(banner.PANEL_Y)}" width="${String(panelWidth)}" height="${String(banner.PANEL_HEIGHT)}" rx="${String(banner.PANEL_RADIUS)}" fill="${COLORS.panel}" stroke="${COLORS.line}" stroke-width="2"/>`;
  return `<rect width="100%" height="100%" fill="${COLORS.plane}"/>${mark}${wordmark}${title}${panel}`;
}

function textMarkup(element: AnimatedText, name: string, x: number, size: number): string {
  const weight = element.bold ? '700' : '400';
  return `<text class="${name}" x="${String(x)}" y="${String(banner.CODE_Y)}" font-family="GS Mono" font-weight="${weight}" font-size="${String(size)}" fill="${element.color}" xml:space="preserve">${escapeXml(element.text)}</text>`;
}

/** Banner do README: a linha da vitrine vira de goianês pra JavaScript e volta, só com CSS dentro do SVG. */
export function readmeBannerSvg(fonts: BannerFonts): string {
  const line = HERO_LINES[BRAND_CARD_LINE] ?? [];
  const frames = bannerFrames(line);
  const code = codeElements(line, frames).map((element, index) => ({ element, name: `c${String(index)}`, x: banner.CODE_X, size: banner.CODE_FONT }));
  const labels = labelElements(frames).map((element, index) => ({ element, name: `l${String(index)}`, x: banner.LABEL_X, size: banner.LABEL_FONT }));
  const caret = caretElement(frames);
  const caretRect = `<rect class="k" x="${String(banner.CODE_X + banner.CARET_NUDGE)}" y="${String(banner.CARET_TOP)}" width="${String(banner.CARET_WIDTH)}" height="${String(banner.CARET_HEIGHT)}" fill="${caret.color}"/>`;
  const texts = [...labels, ...code];
  const css = [fontCss(fonts), ...texts.map((item) => animationCss(item.name, item.element.keyframes)), animationCss('k', caret.keyframes), '@media (prefers-reduced-motion: reduce){*{animation:none!important}}'].join('');
  const body = texts.map((item) => textMarkup(item.element, item.name, item.x, item.size)).join('');
  const size = `width="${String(banner.BANNER_WIDTH)}" height="${String(banner.BANNER_HEIGHT)}" viewBox="0 0 ${String(banner.BANNER_WIDTH)} ${String(banner.BANNER_HEIGHT)}"`;
  const label = `${escapeXml(HOME_TEXTS.title)} ${escapeXml(BRAND_CARD_TEXTS.alt)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" ${size} role="img" aria-label="${label}"><style>${css}</style>${staticMarkup()}${body}${caretRect}</svg>\n`;
}
