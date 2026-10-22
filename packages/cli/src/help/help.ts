import type { Tone } from '@goiasscript/compiler';
import { COMMANDS } from '../args/commands.data.ts';
import { OPTIONS } from '../args/options.data.ts';
import type { OptionName } from '../args/args.types.ts';
import { VERSION } from '../version.ts';
import { chooseByTone } from '../tone-choice.ts';
import { HELP_ACCENT_HINTS, HELP_COMMANDS_HEADING, HELP_OPTIONS_HEADING, HELP_TITLES } from './help.constants.ts';

const INDENT = '  ';
const OPTION_COLUMN = 24;

const optionLabel = (name: OptionName): string => {
  const { flag, short } = OPTIONS[name];
  return short === undefined ? flag : `-${short}, ${flag}`;
};

export function renderHelp(tone: Tone): string {
  const commandLines = COMMANDS.map(
    (command) => `${INDENT}goiasscript ${command.usage}\n${INDENT}${INDENT}${chooseByTone(tone, command.summary, command.neutralSummary)}`,
  );
  const optionLines = (Object.keys(OPTIONS) as readonly OptionName[]).map(
    (name) => `${INDENT}${optionLabel(name).padEnd(OPTION_COLUMN)}${chooseByTone(tone, OPTIONS[name].summary, OPTIONS[name].neutralSummary)}`,
  );
  const [rootTitle, neutralTitle] = HELP_TITLES;
  const [rootHint, neutralHint] = HELP_ACCENT_HINTS;
  return [
    `${chooseByTone(tone, rootTitle, neutralTitle)} (${VERSION})`, '', HELP_COMMANDS_HEADING, ...commandLines, '',
    HELP_OPTIONS_HEADING, ...optionLines, '', `${INDENT}${chooseByTone(tone, rootHint, neutralHint)}`, '',
  ].join('\n');
}
