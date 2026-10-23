import { compile as compileSource, type CompileOptions, type CompileResult, type CompileSuccess } from '@goiasscript/compiler';
import { RUN_LIMITS } from '../config/run-limits.constants.ts';
import { OPTIMIZER_UNAVAILABLE_MARKER, PLAYGROUND_FILE_NAME } from './compile-service.constants.ts';
import type { CompileService, CompileServiceOptions, CompileView, OptimizerModule, TargetView } from './compile-service.types.ts';
import { toEditorMarkers } from './diagnostic-markers.ts';
import { lessonUrlOf as defaultLessonUrlOf } from './lesson-routes.ts';

interface Memo {
  readonly source: string;
  readonly view: TargetView;
  readonly promise: Promise<CompileView>;
}

export function createCompileService(options: CompileServiceOptions): CompileService {
  const compile = options.compile ?? compileSource;
  const lessonUrlOf = options.lessonUrlOf ?? defaultLessonUrlOf;
  let optimizer: Promise<OptimizerModule> | undefined;
  let memo: Memo | undefined;

  // Falha de carregamento não fica guardada: a próxima tentativa pede o chunk de novo.
  const loadOptimizer = (): Promise<OptimizerModule> => {
    optimizer ??= options.loadOptimizer().catch((error: unknown) => {
      optimizer = undefined;
      throw error;
    });
    return optimizer;
  };

  async function optimizedCode(result: CompileSuccess): Promise<string | null> {
    try {
      return (await (await loadOptimizer()).optimize(result, { minify: false })).code;
    } catch {
      return null;
    }
  }

  async function build(source: string, view: TargetView): Promise<CompileView> {
    const compileOptions: CompileOptions = { target: 'playground', tone: options.tone, sourceMap: true, loopLimit: RUN_LIMITS.loopLimit, fileName: PLAYGROUND_FILE_NAME };
    const result: CompileResult = compile(source, compileOptions);
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
      memo = { source, view, promise };
      return promise;
    },
  };
}
