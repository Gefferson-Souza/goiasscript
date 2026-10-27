import type { CompileOptions, CompileResult, CompileSuccess } from '@goiasscript/compiler';
import { RUN_LIMITS } from '../config/run-limits.constants.ts';
import { OPTIMIZER_UNAVAILABLE_MARKER, PLAYGROUND_FILE_NAME } from './compile-service.constants.ts';
import type { CompileFunction, CompileService, CompileServiceOptions, CompileView, TargetView } from './compile-service.types.ts';
import { toEditorMarkers } from './diagnostic-markers.ts';
import { loadOnce } from './load-once.ts';
import { lessonUrlOf as defaultLessonUrlOf } from './lesson-routes.ts';

interface Memo {
  readonly source: string;
  readonly view: TargetView;
  readonly promise: Promise<CompileView>;
}

const defaultLoadCompile = (): Promise<CompileFunction> => import('@goiasscript/compiler').then((module) => module.compile);

export function createCompileService(options: CompileServiceOptions): CompileService {
  const loadCompiler = loadOnce(options.loadCompile ?? defaultLoadCompile);
  const loadOptimizer = loadOnce(options.loadOptimizer);
  const lessonUrlOf = options.lessonUrlOf ?? defaultLessonUrlOf;
  let memo: Memo | undefined;

  async function optimizedCode(result: CompileSuccess): Promise<string | null> {
    try {
      return (await (await loadOptimizer()).optimize(result, { minify: false })).code;
    } catch {
      return null;
    }
  }

  async function build(source: string, view: TargetView): Promise<CompileView> {
    const compileOptions: CompileOptions = { target: 'playground', tone: options.tone, sourceMap: true, loopLimit: RUN_LIMITS.loopLimit, fileName: PLAYGROUND_FILE_NAME };
    const result: CompileResult = (await loadCompiler())(source, compileOptions);
    const { markers, hiddenMarkerCount } = toEditorMarkers(result.diagnostics, source, lessonUrlOf);
    if (!result.ok) return { result, generatedCode: null, markers, hiddenMarkerCount };
    if (view === 'didactic') return { result, generatedCode: result.code, markers, hiddenMarkerCount };
    const optimized = await optimizedCode(result);
    if (optimized !== null) return { result, generatedCode: optimized, markers, hiddenMarkerCount };
    return { result, generatedCode: result.code, markers: [OPTIMIZER_UNAVAILABLE_MARKER, ...markers], hiddenMarkerCount };
  }

  return {
    compile(source, view) {
      if (memo?.source === source && memo.view === view) return memo.promise;
      const promise = build(source, view);
      const entry: Memo = { source, view, promise };
      memo = entry;
      const forget = (): void => {
        if (memo === entry) memo = undefined;
      };
      promise.then((built) => {
        if (built.markers[0] === OPTIMIZER_UNAVAILABLE_MARKER) forget();
      }, forget);
      return promise;
    },
  };
}
