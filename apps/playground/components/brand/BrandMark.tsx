import { COLORS } from '@/lib/design/design-tokens.constants';

interface Props {
  readonly size?: number;
  readonly className?: string;
}

const DEFAULT_SIZE = 28;

/** Símbolo do GoiásScript: a palavra em goianês (pequi) e o cursor que a transforma (lavanda). */
export function BrandMark({ size = DEFAULT_SIZE, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" className={className}>
      <rect width="32" height="32" rx="7" fill={COLORS.plane} />
      <rect x="5" y="12" width="15" height="8" rx="2" fill={COLORS.pequi} />
      <rect x="23" y="7" width="3" height="18" rx="1" fill={COLORS.caret} />
    </svg>
  );
}
