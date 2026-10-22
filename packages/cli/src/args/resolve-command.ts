import { COMMANDS } from './commands.data.ts';
import type { CommandId } from './args.types.ts';

const MAX_SUGGESTION_DISTANCE = 2;

const nfc = (text: string): string => text.normalize('NFC');

export function resolveCommandName(typed: string): CommandId | null {
  const name = nfc(typed);
  return COMMANDS.find((command) => command.name === name || command.asciiName === name)?.id ?? null;
}

const nextRow = (row: readonly number[], leftChar: string, rightChars: readonly string[]): readonly number[] =>
  rightChars.reduce<readonly number[]>(
    (current, rightChar, column) => [
      ...current,
      Math.min((row[column + 1] ?? 0) + 1, (current[column] ?? 0) + 1, (row[column] ?? 0) + (leftChar === rightChar ? 0 : 1)),
    ],
    [(row[0] ?? 0) + 1],
  );

function editDistance(left: string, right: string): number {
  const rightChars = Array.from(right);
  const initial = Array.from({ length: rightChars.length + 1 }, (_unused, index) => index);
  const last = Array.from(left).reduce<readonly number[]>((row, leftChar) => nextRow(row, leftChar, rightChars), initial);
  return last[rightChars.length] ?? 0;
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
