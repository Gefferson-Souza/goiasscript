'use client';
import { useCallback, useEffect, useReducer, useState } from 'react';
import { createCompileService } from '../compile-service.ts';
import type { CompileService, CompileView } from '../compile-service.types.ts';
import { browserStorage } from '../browser-storage.ts';
import { PLAYGROUND_FILE_NAME } from '../compile-service.constants.ts';
import { createBrowserRunnerClient } from '../run/browser-runner.ts';
import { hostDiagnostic } from '../run/host-diagnostics.ts';
import { INITIAL_RUN_VIEW, reduceRunView } from '../run/run-state-view.ts';
import type { RunnerClient } from '../run/runner-client.types.ts';
import { startRun } from '../run/start-run.ts';
import type { GradeResult } from './grade-exercise.types.ts';
import { gradeExercise } from './grade-exercise.ts';
import { COMPILE_DEBOUNCE_MS } from './lesson-session.constants.ts';
import type { LessonSession, LessonSources, LessonTab } from './lesson-session.types.ts';
import type { LessonView } from './lesson.types.ts';
import { markCompleted, readProgress } from './progress.ts';

const NO_MARKERS: CompileView['markers'] = [];

function useRunnerClient(): RunnerClient | null {
  const [runner, setRunner] = useState<RunnerClient | null>(null);
  useEffect(() => {
    const created = createBrowserRunnerClient();
    setRunner(created);
    return () => {
      created.dispose();
      setRunner(null);
    };
  }, []);
  return runner;
}

function useLiveMarkers(service: CompileService, source: string): CompileView['markers'] {
  const [compiled, setCompiled] = useState<{ readonly source: string; readonly view: CompileView } | null>(null);
  useEffect(() => {
    let current = true;
    const timer = window.setTimeout(() => {
      void service.compile(source, 'didactic').then((view) => {
        if (current) setCompiled({ source, view });
      });
    }, COMPILE_DEBOUNCE_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [service, source]);
  return compiled?.source === source ? compiled.view.markers : NO_MARKERS;
}

interface GradingDeps {
  readonly lesson: LessonView;
  readonly source: string;
  readonly service: CompileService;
  readonly runner: RunnerClient | null;
}

function useExerciseGrading({ lesson, source, service, runner }: GradingDeps) {
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [grading, setGrading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDone(readProgress(browserStorage()).completed.includes(lesson.id));
  }, [lesson.id]);

  const check = useCallback(() => {
    if (runner === null) return;
    setGrading(true);
    setGrade(null);
    void gradeExercise({ source, exercise: lesson.exercise }, { compile: (code) => service.compile(code, 'didactic'), runner })
      .then((result) => {
        setGrade(result);
        if (result.verdict !== 'correct') return;
        markCompleted(browserStorage(), lesson.id);
        setDone(true);
      })
      .finally(() => {
        setGrading(false);
      });
  }, [lesson.exercise, lesson.id, runner, service, source]);

  return { grade, grading, done, check };
}

export function useLessonSession(lesson: LessonView): LessonSession {
  const [tab, setTab] = useState<LessonTab>('example');
  const [sources, setSources] = useState<LessonSources>({ example: lesson.exampleCode, exercise: lesson.exercise.starter });
  const [runView, dispatch] = useReducer(reduceRunView, INITIAL_RUN_VIEW);
  const [service] = useState(() => createCompileService({ tone: 'raiz', loadOptimizer: () => import('@goiasscript/optimizer') }));
  const runner = useRunnerClient();
  const source = sources[tab];
  const markers = useLiveMarkers(service, source);
  const exercise = useExerciseGrading({ lesson, source: sources.exercise, service, runner });

  const edit = useCallback((value: string) => {
    setSources((previous) => ({ ...previous, [tab]: value }));
  }, [tab]);

  const runExample = useCallback(() => {
    void startRun({
      source: sources.example,
      fileName: PLAYGROUND_FILE_NAME,
      compile: (code) => service.compile(code, 'didactic'),
      runner,
      fallbackDiagnostic: hostDiagnostic('compileFailure', 'raiz'),
      dispatch,
    });
  }, [runner, service, sources.example]);

  const answer = useCallback((value: string) => {
    dispatch({ kind: 'answer' });
    runner?.answer(value);
  }, [runner]);

  const stop = useCallback(() => {
    runner?.stop();
  }, [runner]);

  return {
    tab,
    source,
    markers,
    runView,
    running: runView.status === 'running' || runView.status === 'asking',
    ...exercise,
    selectTab: setTab,
    edit,
    runExample,
    stop,
    answer,
  };
}
