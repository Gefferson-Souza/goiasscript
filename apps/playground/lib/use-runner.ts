'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

export type LogEntry = { level: 'log' | 'warn' | 'error'; parts: string[] };

export type RunOutcome =
  | { kind: 'idle' }
  | { kind: 'running' }
  | { kind: 'ok'; logs: LogEntry[]; js: string }
  | { kind: 'compile-error'; message: string }
  | { kind: 'runtime-error'; message: string; logs: LogEntry[]; js: string }
  | { kind: 'timeout'; logs: LogEntry[] };

const HARD_TIMEOUT_MS = 3000;

export function useRunner() {
  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const partialLogsRef = useRef<LogEntry[]>([]);
  const [outcome, setOutcome] = useState<RunOutcome>({ kind: 'idle' });

  const teardown = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const run = useCallback(
    (code: string) => {
      teardown();
      partialLogsRef.current = [];
      setOutcome({ kind: 'running' });

      const worker = new Worker(new URL('../workers/runner.worker.ts', import.meta.url), {
        type: 'module',
      });
      workerRef.current = worker;

      worker.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (data.type === 'ok') {
          setOutcome({ kind: 'ok', logs: data.logs, js: data.js });
        } else if (data.type === 'compile-error') {
          setOutcome({ kind: 'compile-error', message: data.error });
        } else if (data.type === 'runtime-error') {
          setOutcome({
            kind: 'runtime-error',
            message: data.message,
            logs: data.logs,
            js: data.js,
          });
        }
        teardown();
      };

      worker.onerror = err => {
        setOutcome({
          kind: 'runtime-error',
          message: err.message || 'Ô rapaz! O worker deu chabu.',
          logs: partialLogsRef.current,
          js: '',
        });
        teardown();
      };

      timeoutRef.current = setTimeout(() => {
        setOutcome({ kind: 'timeout', logs: partialLogsRef.current });
        teardown();
      }, HARD_TIMEOUT_MS);

      worker.postMessage({ type: 'run', code });
    },
    [teardown]
  );

  return { outcome, run };
}
