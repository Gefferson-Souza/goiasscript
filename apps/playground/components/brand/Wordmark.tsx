import { BrandMark } from './BrandMark';

interface Props {
  readonly suffix?: string;
}

/** Nome do projeto como na identidade: "Goiás" em pequi (goianês), "Script" em tinta neutra. */
export function Wordmark({ suffix }: Props) {
  return (
    <span className="flex items-center gap-2.5">
      <BrandMark />
      <span className="text-lg font-bold tracking-tight">
        <span className="text-pequi">Goiás</span>
        <span className="text-ink">Script</span>
      </span>
      {suffix !== undefined && <span className="font-mono text-xs text-dim">{suffix}</span>}
    </span>
  );
}
