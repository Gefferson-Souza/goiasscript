import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import { renderSuccess } from '../scaffold/next-steps.ts';
import { validateProjectName } from '../scaffold/project-name.ts';
import { scaffoldProject } from '../scaffold/scaffold-project.ts';
import { renderToolNotice } from '../tool-notice.ts';
import type { CommandContext } from './command.types.ts';

export async function scaffoldCommand({ io, parsed }: CommandContext): Promise<ExitCode> {
  const { tone } = parsed.options;
  const name = parsed.positionals[0] ?? '';
  const check = validateProjectName(name, io.env.platform);
  if (!check.ok) {
    io.err.write(renderToolNotice({ code: 'GS0905', tone, lines: [check.detail] }));
    return EXIT_CODE.usage;
  }
  const result = await scaffoldProject(name, io);
  if (!result.ok) {
    io.err.write(renderToolNotice({ code: result.code, tone, lines: [result.detail], ...(result.args === undefined ? {} : { args: result.args }) }));
    return EXIT_CODE.usage;
  }
  io.out.write(renderSuccess(name, tone));
  return EXIT_CODE.ok;
}
