'use client';
import { HERO_LINES, HERO_OUTPUT } from '@/lib/landing/hero-code.constants';
import { renderSide, swapCount } from '@/lib/landing/hero-code';
import type { HeroLine, SameTone, SwapSegment } from '@/lib/landing/hero-code.types';
import { HOME_TEXTS } from './home-texts.constants';
import { useHeroSweep } from './use-hero-sweep';

const TONE_CLASS: Record<SameTone, string> = { plain: 'text-ink', string: 'text-string', number: 'text-number' };

function Swap({ segment, flipped }: { readonly segment: SwapSegment; readonly flipped: boolean }) {
  const width = flipped ? segment.javascript.length : segment.dialect.length;
  return (
    <span
      className="hero-swap"
      data-flipped={flipped}
      style={{ width: `${String(width)}ch` }}
    >
      <span className="hero-face hero-face-front text-pequi">{segment.dialect}</span>
      <span className="hero-face hero-face-back text-cyan">{segment.javascript}</span>
    </span>
  );
}

function CodeLine({ line, flippedFrom, flipped }: { readonly line: HeroLine; readonly flippedFrom: number; readonly flipped: readonly boolean[] }) {
  let swapIndex = flippedFrom;
  return (
    <span className="block min-h-[1.75rem] whitespace-pre">
      {line.map((segment, position) => {
        if (segment.kind === 'same') return <span key={position} className={TONE_CLASS[segment.tone]}>{segment.text}</span>;
        const isFlipped = flipped[swapIndex] ?? false;
        swapIndex += 1;
        return <Swap key={position} segment={segment} flipped={isFlipped} />;
      })}
    </span>
  );
}

const OFFSETS = HERO_LINES.map((_line, index) => swapCount(HERO_LINES.slice(0, index)));

export function HeroCode() {
  const { flipped, row, side, flip } = useHeroSweep(HERO_LINES);
  const isJavaScript = side === 'javascript';
  return (
    <figure aria-label={HOME_TEXTS.figureLabel} className="overflow-hidden rounded-lg border border-line bg-panel">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 text-sm">
        <span className={isJavaScript ? 'font-semibold text-cyan' : 'font-semibold text-pequi'} data-side={side}>
          {isJavaScript ? HOME_TEXTS.javascript : HOME_TEXTS.dialect}
        </span>
        <button
          type="button"
          onClick={flip}
          className="rounded border border-edge px-3 py-1 text-ink transition-colors duration-enter ease-settle hover:border-caret hover:text-caret"
        >
          {isJavaScript ? HOME_TEXTS.toDialect : HOME_TEXTS.toJavaScript}
        </button>
      </div>
      <div aria-hidden="true" className="relative overflow-x-auto py-4 pl-6 pr-3 font-mono text-[0.72rem] leading-7 sm:pl-8 sm:pr-4 sm:text-[0.95rem]">
        <span className="hero-caret" style={{ top: `calc(1rem + ${String(row)} * 1.75rem)` }} />
        {HERO_LINES.map((line, index) => (
          <CodeLine key={index} line={line} flippedFrom={OFFSETS[index] ?? 0} flipped={flipped} />
        ))}
      </div>
      <div className="sr-only">
        <p>{HOME_TEXTS.srDialect}</p>
        <pre>{renderSide(HERO_LINES, 'dialect')}</pre>
        <p>{HOME_TEXTS.srJavaScript}</p>
        <pre>{renderSide(HERO_LINES, 'javascript')}</pre>
      </div>
      <figcaption className="border-t border-line px-4 py-3 font-mono text-sm">
        <span className="mb-1 block font-sans text-xs text-dim">{HOME_TEXTS.outputTitle}</span>
        {HERO_OUTPUT.map((line) => (
          <span key={line} className="block text-ink">{line}</span>
        ))}
      </figcaption>
    </figure>
  );
}
