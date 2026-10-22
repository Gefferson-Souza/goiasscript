import type { ReplCommandSpec } from './repl-commands.types.ts';

export const REPL_COMMANDS: readonly ReplCommandSpec[] = [
  { id: 'help', name: '.desenrola' },
  { id: 'bindings', name: '.mostra_os_trem' },
  { id: 'history', name: '.lembra_aí', asciiName: '.lembra_ai' },
  { id: 'clear', name: '.limpa_o_terreiro' },
  { id: 'reset', name: '.zera_o_trem' },
  { id: 'exit', name: '.vaza' },
];
