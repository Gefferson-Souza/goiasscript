import type { CliIo } from '../io.types.ts';
import { ANSI, DUMB_TERMINAL } from './brand-colors.constants.ts';
import type { ColorContext } from './brand-colors.types.ts';

// Convenção no-color.org: NO_COLOR com qualquer valor não vazio desliga a cor.
export function colorEnabled({ isTty, variables }: ColorContext): boolean {
  const noColor = variables['NO_COLOR'];
  return isTty && (noColor === undefined || noColor === '') && variables['TERM'] !== DUMB_TERMINAL;
}

export function ioColorEnabled(io: CliIo): boolean {
  return colorEnabled({ isTty: io.streams.isTty, variables: io.env.variables });
}

export function paint(text: string, code: string, enabled: boolean): string {
  return enabled ? `${code}${text}${ANSI.reset}` : text;
}

/** Nome do projeto como na identidade: "Goiás" em pequi, "Script" na cor normal do terminal. */
export function brandName(enabled: boolean): string {
  return `${paint('Goiás', ANSI.pequiBold, enabled)}Script`;
}
