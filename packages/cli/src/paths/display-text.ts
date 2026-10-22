const CONTROL_CHARACTERS = /\p{Cc}/gu;
const HEX_RADIX = 16;
const ESCAPE_WIDTH = 2;

const escapeControl = (character: string): string =>
  `\\x${(character.codePointAt(0) ?? 0).toString(HEX_RADIX).padStart(ESCAPE_WIDTH, '0')}`;

// Nome de arquivo é entrada hostil: ESC, OSC, C1 e quebra de linha não podem chegar crus ao terminal.
export const printableName = (name: string): string => name.replace(CONTROL_CHARACTERS, escapeControl);
