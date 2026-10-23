'use client';
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { createCompileService } from '@/lib/compile-service';
import type { CompileService, CompileView, TargetView } from '@/lib/compile-service.types';
import { browserStorage } from '@/lib/browser-storage';
import { loadExampleSource, loadExamples } from '@/lib/examples';
import type { ExampleEntry } from '@/lib/examples.types';
import { createBrowserRunnerClient } from '@/lib/run/browser-runner';
import { INITIAL_RUN_VIEW, reduceRunView } from '@/lib/run/run-state-view';
import { hostDiagnostic } from '@/lib/run/host-diagnostics';
import { startRun } from '@/lib/run/start-run';
import type { RunnerClient } from '@/lib/run/runner-client.types';
import { readSavedCode, writeSavedCode } from '@/lib/saved-code';
import { SHARE_HASH_PREFIX } from '@/lib/share-link.constants';
import { decodeShareLink, encodeShareLink } from '@/lib/share-link';
import { PLAYGROUND_FILE_NAME } from '@/lib/compile-service.constants';
import { TEXTS } from '@/components/ui-texts.constants';
import { COMPILE_DEBOUNCE_MS, SHARE_MESSAGE_MS, STARTER_CODE } from './playground.constants';

const NO_MARKERS: CompileView['markers'] = [];

export function usePlayground() {
  const [source, setSource] = useState(STARTER_CODE);
  const [target, setTarget] = useState<TargetView>('didactic');
  const [view, setView] = useState<CompileView | null>(null);
  const [examples, setExamples] = useState<readonly ExampleEntry[]>([]);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [runView, dispatch] = useReducer(reduceRunView, INITIAL_RUN_VIEW);
  const client = useRef<RunnerClient | null>(null);
  const service = useRef<CompileService | null>(null);

  // O compilador usa o otimizador em chunk à parte: só baixa quando o aluno pede o JS otimizado.
  service.current ??= createCompileService({ tone: 'raiz', loadOptimizer: () => import('@goiasscript/optimizer') });

  useEffect(() => {
    const shared = decodeShareLink(window.location.hash);
    if (shared !== null) {
      // Sem limpar o hash, recarregar a página descartaria as edições do aluno em favor do link.
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
      writeSavedCode(browserStorage(), shared);
    }
    const initial = shared ?? readSavedCode(browserStorage());
    if (initial !== null) setSource(initial);
    void loadExamples().then(setExamples);
  }, []);

  useEffect(() => {
    const runner = createBrowserRunnerClient();
    client.current = runner;
    return () => {
      runner.dispose();
      client.current = null;
    };
  }, []);

  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      void service.current?.compile(source, target).then((next) => {
        if (current) setView(next);
      });
    }, COMPILE_DEBOUNCE_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [source, target]);

  const edit = useCallback((next: string) => {
    setSource(next);
    writeSavedCode(browserStorage(), next);
  }, []);

  const run = useCallback(
    () =>
      startRun({
        source,
        fileName: PLAYGROUND_FILE_NAME,
        compile: (code) => service.current?.compile(code, 'didactic') ?? Promise.reject(new Error('compile service missing')),
        runner: client.current,
        fallbackDiagnostic: hostDiagnostic('compileFailure', 'raiz'),
        dispatch,
      }),
    [source],
  );

  const answer = useCallback((value: string) => {
    dispatch({ kind: 'answer' });
    client.current?.answer(value);
  }, []);

  const pickExample = useCallback(
    async (id: string) => {
      const entry = examples.find((example) => example.id === id);
      const code = entry === undefined ? null : await loadExampleSource(entry.file);
      if (code !== null) edit(code);
    },
    [edit, examples],
  );

  const share = useCallback(async () => {
    const payload = encodeShareLink(source);
    const message = await copyShareLink(payload);
    setShareMessage(message);
    window.setTimeout(() => setShareMessage(null), SHARE_MESSAGE_MS);
  }, [source]);

  return {
    source,
    target,
    setTarget,
    markers: view?.markers ?? NO_MARKERS,
    generatedCode: view?.generatedCode ?? null,
    hiddenMarkerCount: view?.hiddenMarkerCount ?? 0,
    examples,
    shareMessage,
    runView,
    running: runView.status === 'running' || runView.status === 'asking',
    edit,
    run,
    stop: () => client.current?.stop(),
    clear: () => edit(''),
    answer,
    pickExample,
    share,
  };
}

async function copyShareLink(payload: string | null): Promise<string> {
  if (payload === null) return TEXTS.linkTooBig;
  const link = `${window.location.origin}${window.location.pathname}${SHARE_HASH_PREFIX}${payload}`;
  try {
    await navigator.clipboard.writeText(link);
    return TEXTS.linkCopied;
  } catch {
    return TEXTS.linkNotCopied;
  }
}
