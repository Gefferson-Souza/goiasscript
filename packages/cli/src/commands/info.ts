import { EXIT_CODE } from '../exit-codes.constants.ts';
import { renderHelp } from '../help/help.ts';
import { VERSION } from '../version.ts';
import type { CommandHandler } from './command.types.ts';
import { INFO_LABELS, INFO_NAME } from './info.constants.ts';

const withVersionPrefix = (version: string): string => (version.startsWith('v') ? version : `v${version}`);

export const infoCommand: CommandHandler = ({ io, parsed }) => {
  const facts = [
    `${INFO_NAME} ${VERSION}`,
    `${INFO_LABELS.node} ${withVersionPrefix(io.env.nodeVersion)}`,
    `${INFO_LABELS.system} ${io.env.platform}`,
  ];
  io.out.write(`${facts.join('\n')}\n\n${renderHelp(parsed.options.tone)}`);
  return Promise.resolve(EXIT_CODE.ok);
};
