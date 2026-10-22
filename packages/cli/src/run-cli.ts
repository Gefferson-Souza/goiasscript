import type { Tone } from '@goiasscript/compiler';
import { parseCommandLine } from './args/parse-args.ts';
import { resolveCommandName, suggestCommandName } from './args/resolve-command.ts';
import { COMMAND_HANDLERS } from './commands/registry.ts';
import type { CliDependencies } from './commands/command.types.ts';
import { EXIT_CODE } from './exit-codes.constants.ts';
import type { ExitCode } from './exit-codes.types.ts';
import { renderHelp } from './help/help.ts';
import type { CliIo } from './io.types.ts';
import { isSupportedNode, MINIMUM_NODE_LABEL } from './node-version.ts';
import { chooseByTone } from './tone-choice.ts';
import { renderToolNotice } from './tool-notice.ts';

const TONE_FLAG = '--tom';
const NEUTRAL_TONE: Tone = 'neutro';
const DEFAULT_TONE: Tone = 'raiz';
const suggestionLine = (tone: Tone, name: string): string => chooseByTone(tone, `Cê quis dizer "${name}"?`, `Você quis dizer "${name}"?`);
const HELP_LIKE = new Set(['--help', '-h', '--version', '-v', '-V']);

function toneOf(argv: readonly string[]): Tone {
  const flagIndex = argv.indexOf(TONE_FLAG);
  const inline = argv.includes(`${TONE_FLAG}=${NEUTRAL_TONE}`);
  return inline || (flagIndex >= 0 && argv[flagIndex + 1] === NEUTRAL_TONE) ? NEUTRAL_TONE : DEFAULT_TONE;
}

function warnOldNode(io: CliIo, tone: Tone): void {
  if (isSupportedNode(io.env.nodeVersion)) return;
  io.err.write(renderToolNotice({ code: 'GS0904', tone, args: { minimum: MINIMUM_NODE_LABEL } }));
}

function reportUsage(argv: readonly string[], detail: string, io: CliIo): ExitCode {
  const tone = toneOf(argv);
  const [typed] = argv;
  const suggestion = typed !== undefined && !HELP_LIKE.has(typed) && resolveCommandName(typed) === null ? suggestCommandName(typed) : null;
  const lines = [detail, ...(suggestion === null ? [] : [suggestionLine(tone, suggestion)])];
  io.err.write(renderToolNotice({ code: 'GS0905', tone, lines }));
  return EXIT_CODE.usage;
}

export async function runCli(argv: readonly string[], io: CliIo, dependencies: CliDependencies): Promise<ExitCode> {
  warnOldNode(io, toneOf(argv));
  if (argv.length === 0) {
    io.out.write(renderHelp(DEFAULT_TONE));
    return EXIT_CODE.ok;
  }
  const result = parseCommandLine(argv);
  if (!result.ok) return reportUsage(argv, result.detail, io);
  return COMMAND_HANDLERS[result.parsed.command]({ io, parsed: result.parsed, dependencies });
}
