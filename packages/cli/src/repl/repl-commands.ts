import { editDistance } from '../args/edit-distance.ts';
import { REPL_COMMANDS } from './repl-commands.data.ts';
import type { ReplCommandParse } from './repl-commands.types.ts';

const COMMAND_START = /^\.[\p{L}_]/u;
const WHITESPACE = /\s+/u;
const MAX_SUGGESTION_DISTANCE = 2;

function suggestCommand(typed: string): string | undefined {
  const ranked = REPL_COMMANDS.map((command) => ({
    name: command.name,
    distance: Math.min(...[command.name, command.asciiName ?? command.name].map((spelling) => editDistance(typed, spelling))),
  })).toSorted((first, second) => first.distance - second.distance);
  const best = ranked[0];
  return best !== undefined && best.distance <= MAX_SUGGESTION_DISTANCE ? best.name : undefined;
}

export function parseReplCommand(line: string): ReplCommandParse | null {
  if (!COMMAND_START.test(line)) return null;
  const typed = (line.trimEnd().split(WHITESPACE)[0] ?? '').normalize('NFC');
  const found = REPL_COMMANDS.find((command) => command.name === typed || command.asciiName === typed);
  if (found !== undefined) return { kind: 'command', id: found.id };
  const suggestion = suggestCommand(typed);
  return suggestion === undefined ? { kind: 'unknown', typed } : { kind: 'unknown', typed, suggestion };
}
