import { toneOf } from '../args/tone-argument.ts';
import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';
import { isSupportedNode, MINIMUM_NODE_LABEL } from '../node-version.ts';
import { renderToolNotice } from '../tool-notice.ts';
import { parseReplArguments } from './repl-arguments.ts';
import { runRepl } from './run-repl.ts';

export function runGoias(argv: readonly string[], io: CliIo): Promise<ExitCode> {
  if (!isSupportedNode(io.env.nodeVersion)) {
    io.err.write(renderToolNotice({ code: 'GS0904', tone: toneOf(argv), args: { minimum: MINIMUM_NODE_LABEL } }));
  }
  const parsed = parseReplArguments(argv);
  if (!parsed.ok) {
    io.err.write(renderToolNotice({ code: 'GS0905', tone: toneOf(argv), lines: [parsed.detail] }));
    return Promise.resolve(EXIT_CODE.usage);
  }
  return runRepl(io, { tone: parsed.tone });
}
