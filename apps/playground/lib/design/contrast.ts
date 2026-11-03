const HEX_COLOR = /^#[0-9a-f]{6}$/iu;
const RED_OFFSET = 1;
const GREEN_OFFSET = 3;
const BLUE_OFFSET = 5;
const CHANNEL_OFFSETS = [RED_OFFSET, GREEN_OFFSET, BLUE_OFFSET] as const;
const HEX_RADIX = 16;
const CHANNEL_MAX = 255;
// Constantes da fórmula de luminância relativa sRGB da WCAG 2.x.
const LINEAR_THRESHOLD = 0.03928;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_SCALE = 1.055;
const GAMMA_EXPONENT = 2.4;
const RED_WEIGHT = 0.2126;
const GREEN_WEIGHT = 0.7152;
const BLUE_WEIGHT = 0.0722;
const LUMINANCE_WEIGHTS = [RED_WEIGHT, GREEN_WEIGHT, BLUE_WEIGHT] as const;
const CONTRAST_OFFSET = 0.05;

type Channels = readonly [number, number, number];

function toChannels(hex: string): Channels {
  if (!HEX_COLOR.test(hex)) throw new Error(`Cor precisa ser hex de 6 dígitos (#RRGGBB): ${hex}`);
  const [r, g, b] = CHANNEL_OFFSETS.map((offset) => Number.parseInt(hex.slice(offset, offset + 2), HEX_RADIX));
  return [r ?? 0, g ?? 0, b ?? 0];
}

function toHex(channels: Channels): string {
  return `#${channels.map((value) => Math.round(value).toString(HEX_RADIX).padStart(2, '0')).join('').toUpperCase()}`;
}

function relativeLuminance(hex: string): number {
  const linear = toChannels(hex).map((value) => {
    const unit = value / CHANNEL_MAX;
    return unit <= LINEAR_THRESHOLD ? unit / LINEAR_DIVISOR : ((unit + GAMMA_OFFSET) / GAMMA_SCALE) ** GAMMA_EXPONENT;
  });
  return linear.reduce((sum, value, index) => sum + value * (LUMINANCE_WEIGHTS[index] ?? 0), 0);
}

/** Razão de contraste WCAG 2.x entre duas cores hex, de 1 a 21. */
export function contrastRatio(first: string, second: string): number {
  const [lighter, darker] = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return ((lighter ?? 0) + CONTRAST_OFFSET) / ((darker ?? 0) + CONTRAST_OFFSET);
}

/** Cor resultante de pintar `color` com opacidade `alpha` sobre `background`. */
export function blendOver(color: string, background: string, alpha: number): string {
  const top = toChannels(color);
  const bottom = toChannels(background);
  const mixed = top.map((value, index) => value * alpha + (bottom[index] ?? 0) * (1 - alpha));
  return toHex([mixed[0] ?? 0, mixed[1] ?? 0, mixed[2] ?? 0]);
}
