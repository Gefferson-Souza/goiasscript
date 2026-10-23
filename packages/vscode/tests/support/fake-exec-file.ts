import type { ExecFileCallback } from '../../src/commands/commands.types.ts';
import type { FakeChild, FakeExecFile, FakeExecFileOptions, FakeOutcome } from './fake-exec-file.types.ts';

const SUCCESS: FakeOutcome = { exitCode: 0, stdout: '', stderr: '' };

export function exitError(exitCode: number): Error {
  return Object.assign(new Error(`Command failed with exit code ${String(exitCode)}`), { code: exitCode });
}

function outcomeError(outcome: FakeOutcome): Error | null {
  if (outcome.spawnErrorCode !== undefined) return Object.assign(new Error(`spawn ${outcome.spawnErrorCode}`), { code: outcome.spawnErrorCode });
  return outcome.exitCode === 0 ? null : exitError(outcome.exitCode);
}

function createChild(callback: ExecFileCallback): FakeChild {
  const handlers: { stdout: ((chunk: string) => void)[]; stderr: ((chunk: string) => void)[] } = { stdout: [], stderr: [] };
  const emit = (stream: 'stdout' | 'stderr', text: string): void => {
    handlers[stream].forEach((listener) => {
      listener(text);
    });
  };
  const child: FakeChild = {
    stdinWritten: [],
    stdinErrorListeners: [],
    killCount: 0,
    stdin: {
      write: (text) => {
        child.stdinWritten.push(text);
        return true;
      },
      on: (_event, listener) => child.stdinErrorListeners.push(listener),
    },
    stdout: { on: (_event, listener) => handlers.stdout.push(listener) },
    stderr: { on: (_event, listener) => handlers.stderr.push(listener) },
    kill: () => {
      child.killCount += 1;
      return true;
    },
    emitStdout: (text) => {
      emit('stdout', text);
    },
    emitStderr: (text) => {
      emit('stderr', text);
    },
    finish: (outcome) => {
      callback(outcomeError(outcome), outcome.stdout, outcome.stderr);
    },
  };
  return child;
}

export function createFakeExecFile(options: FakeExecFileOptions = {}): FakeExecFile {
  const outcomes = [...(options.outcomes ?? [])];
  const fake: FakeExecFile = {
    calls: [],
    children: [],
    execFile: (file, args, execOptions, callback) => {
      const child = createChild(callback);
      fake.calls.push({ file, args: [...args], options: execOptions });
      fake.children.push(child);
      const outcome = outcomes.shift() ?? SUCCESS;
      if (options.manual !== true) {
        queueMicrotask(() => {
          child.finish(outcome);
        });
      }
      return child;
    },
  };
  return fake;
}
