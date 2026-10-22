import { explainDiagnostic } from '@goiasscript/compiler';
import { DIAGNOSTICS } from '@goiasscript/language';
import { sanitizeForTerminal } from '../diagnostics/sanitize-terminal.ts';
import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import { chooseByTone } from '../tone-choice.ts';
import { renderToolNotice } from '../tool-notice.ts';
import type { CommandContext, CommandHandler } from './command.types.ts';
import { normalizeDiagnosticCode, suggestDiagnosticCode } from './explain-code.ts';
import { renderExplanation, renderListing } from './explain-render.ts';
import { CODE_SUGGESTION, EXPLAIN_LISTING_HINT, UNKNOWN_CODE_DETAIL } from './explain.constants.ts';

function reportUnknownCode({ io, parsed }: CommandContext, typed: string): ExitCode {
  const { tone } = parsed.options;
  const shown = sanitizeForTerminal(typed);
  const suggestion = suggestDiagnosticCode(typed);
  const lines = [
    chooseByTone(tone, UNKNOWN_CODE_DETAIL.root(shown), UNKNOWN_CODE_DETAIL.neutral(shown)),
    ...(suggestion === null ? [] : [chooseByTone(tone, CODE_SUGGESTION.root(suggestion), CODE_SUGGESTION.neutral(suggestion))]),
  ];
  io.err.write(renderToolNotice({ code: 'GS0905', tone, lines }));
  return EXIT_CODE.usage;
}

export const explainCommand: CommandHandler = (context) => {
  const { io, parsed } = context;
  const [typed] = parsed.positionals;
  if (typed === undefined) {
    io.out.write(renderListing(DIAGNOSTICS, chooseByTone(parsed.options.tone, EXPLAIN_LISTING_HINT.root, EXPLAIN_LISTING_HINT.neutral)));
    return Promise.resolve(EXIT_CODE.ok);
  }
  const code = normalizeDiagnosticCode(typed);
  const explanation = code === null ? null : explainDiagnostic(code, parsed.options.tone);
  if (explanation === null) return Promise.resolve(reportUnknownCode(context, typed));
  io.out.write(renderExplanation(explanation));
  return Promise.resolve(EXIT_CODE.ok);
};
