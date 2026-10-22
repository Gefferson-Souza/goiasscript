import { COMMANDS } from './commands.data.ts';
import type { CommandId } from './args.types.ts';
import { editDistance } from './edit-distance.ts';

const MAX_SUGGESTION_DISTANCE = 2;

const nfc = (text: string): string => text.normalize('NFC');

export function resolveCommandName(typed: string): CommandId | null {
  const name = nfc(typed);
  return COMMANDS.find((command) => command.name === name || command.asciiName === name)?.id ?? null;
}

export function suggestCommandName(typed: string): string | null {
  const name = nfc(typed);
  const ranked = COMMANDS.map((command) => ({
    name: command.name,
    distance: Math.min(...[command.name, command.asciiName ?? command.name].map((spelling) => editDistance(name, spelling))),
  })).sort((first, second) => first.distance - second.distance);
  const best = ranked[0];
  return best !== undefined && best.distance <= MAX_SUGGESTION_DISTANCE ? best.name : null;
}
