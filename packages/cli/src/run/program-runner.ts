import { pathToFileURL } from 'node:url';
import type { RuntimeErrorContext, Tone } from '@goiasscript/compiler';
import { EXIT_CODE } from '../exit-codes.constants.ts';
import type { ExitCode } from '../exit-codes.types.ts';
import type { CliIo } from '../io.types.ts';
import { renderDiagnostic } from '../diagnostics/render-diagnostic.ts';
import { toolDiagnostic } from '../diagnostics/tool-diagnostic.ts';
import { PATH_CODE } from '../paths/paths.constants.ts';
import { chooseByTone } from '../tone-choice.ts';
import { PREPARE_FAILURE_TEXT } from './program-runner.constants.ts';
import type { RunRequest } from './program-runner.types.ts';
import type { ProcessHost } from './process-host.types.ts';
import { reportPendingProgram, reportRuntimeError } from './runtime-report.ts';
import { createTempWorkspace, sweepStaleWorkspaces } from './temp-workspace.ts';
import type { TempWorkspace } from './temp-workspace.types.ts';

type RunEvent = 'finished' | 'reported';

function watchProcess(request: RunRequest, context: { readonly io: CliIo; readonly host: ProcessHost; readonly workspace: TempWorkspace; readonly events: Set<RunEvent> }): void {
  const { io, host, workspace, events } = context;
  const runtimeContext: RuntimeErrorContext = { map: request.result.map, helperRange: request.result.helperRange, fileName: request.displayName, source: request.source };
  const fail = (error: unknown): void => {
    if (events.has('reported')) return;
    events.add('reported');
    reportRuntimeError(error, runtimeContext, io, request.tone);
    host.terminate(EXIT_CODE.runtime);
  };
  host.onExit(() => {
    workspace.dispose();
    if (events.has('finished') || events.has('reported')) return;
    reportPendingProgram(io, request.tone, request.displayName);
    host.setExitCode(EXIT_CODE.runtime);
  });
  host.onUnhandledRejection(fail);
  host.onUncaughtException(fail);
  const settle = (): void => {
    events.add('finished');
  };
  // Sem await: o Node avisa em inglês e sai com 13 quando um await de topo nunca se resolve.
  host.importModule(pathToFileURL(workspace.programPath).href).then(settle, fail);
}

async function writeProgram(io: CliIo, workspace: TempWorkspace, request: RunRequest): Promise<boolean> {
  try {
    await io.fs.writeText(workspace.programPath, request.result.code, 'create-new');
    return true;
  } catch {
    workspace.dispose();
    return false;
  }
}

function reportPrepareFailure(io: CliIo, tone: Tone, fileName: string): ExitCode {
  const detail = chooseByTone(tone, PREPARE_FAILURE_TEXT.root, PREPARE_FAILURE_TEXT.neutral);
  const diagnostic = toolDiagnostic(PATH_CODE.outputRefused, tone, { reason: detail });
  io.err.write(`${renderDiagnostic({ diagnostic, fileName, source: null })}\n`);
  return EXIT_CODE.usage;
}

async function tryCreateWorkspace(io: CliIo): Promise<TempWorkspace | null> {
  try {
    return await createTempWorkspace(io);
  } catch {
    return null;
  }
}

export async function runProgram(request: RunRequest, io: CliIo, host: ProcessHost): Promise<ExitCode> {
  await sweepStaleWorkspaces(io, Date.now());
  const workspace = await tryCreateWorkspace(io);
  if (workspace === null) return reportPrepareFailure(io, request.tone, request.displayName);
  const prepared = await writeProgram(io, workspace, request);
  if (!prepared) return reportPrepareFailure(io, request.tone, request.displayName);
  watchProcess(request, { io, host, workspace, events: new Set<RunEvent>() });
  return EXIT_CODE.ok;
}
