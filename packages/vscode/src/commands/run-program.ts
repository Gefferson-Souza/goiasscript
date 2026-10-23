import path from 'node:path';
import { buildCliInvocation } from './cli-invocation.ts';
import { exitCodeOf, isStartFailure, startCli } from './cli-process.ts';
import { requireAllowedDocument } from './command-guards.ts';
import { CLI_ENTRY_RELATIVE_PATH, FAILURE_EXIT_CODE, STDIN_LINE_END } from './commands.constants.ts';
import { messagesFor } from './commands.messages.ts';
import type { ChildProcessLike, LineTerminal, ProgramDeps } from './commands.types.ts';
import { createProgramTerminal } from './program-terminal.ts';

function wireTerminal(terminal: LineTerminal, child: ChildProcessLike): void {
  const forward = (chunk: string): void => {
    terminal.write(chunk);
  };
  child.stdout?.on('data', forward);
  child.stderr?.on('data', forward);
  // Escrever depois que o filho encerrou gera EPIPE no stdin; o resultado do programa já vem pelo encerramento.
  child.stdin?.on('error', () => undefined);
  terminal.onLine((line) => {
    child.stdin?.write(`${line}${STDIN_LINE_END}`);
  });
  terminal.onInterrupt(() => child.kill());
  terminal.onClose(() => child.kill());
}

function launch(deps: ProgramDeps, documentPath: string): void {
  const { host, spawnProgram, runtimePath } = deps;
  const { tone } = host.settings();
  const terminal = createProgramTerminal(host, path.basename(documentPath));
  const invocation = buildCliInvocation({ command: 'bota_pra_moer', documentPath, cliEntry: host.resolvePath(CLI_ENTRY_RELATIVE_PATH), runtimePath, tone, overwrite: false });
  try {
    wireTerminal(
      terminal,
      startCli(spawnProgram, invocation, (error) => {
        const exitCode = exitCodeOf(error);
        if (isStartFailure(error)) terminal.write(messagesFor(tone).spawnFailed);
        terminal.close(exitCode ?? FAILURE_EXIT_CODE);
      }),
    );
  } catch {
    // execFile recusa argumentos inválidos de forma síncrona; o aluno vê o aviso no próprio terminal.
    terminal.write(messagesFor(tone).spawnFailed);
    terminal.close(FAILURE_EXIT_CODE);
    return;
  }
}

export function runProgram(deps: ProgramDeps): (resourceUri?: string) => Promise<void> {
  return async (resourceUri) => {
    const document = await requireAllowedDocument(deps.host, 'bota_pra_moer', resourceUri);
    if (document !== null) launch(deps, document.fsPath);
  };
}
