import type { CompileOptions, CompileResult, CompileSuccess, CoreCompileResult, Tone } from '@goiasscript/compiler';
import { RUN_LIMITS } from '../config/run-limits.constants.ts';
import { OPTIMIZER_UNAVAILABLE_MARKER, PLAYGROUND_FILE_NAME } from './compile-service.constants.ts';
import type { EditorMarker } from './diagnostic-markers.types.ts';
import type { CompileFunction, CompileService, CompileServiceOptions, CompileView, ResultFormatter, TargetView } from './compile-service.types.ts';
import { toEditorMarkers } from './diagnostic-markers.ts';
import { loadOnce } from './load-once.ts';
import { lessonUrlOf as defaultLessonUrlOf } from './lesson-routes.ts';
import { hostDiagnostic } from './run/host-diagnostics.ts';

interface Memo {
  readonly source: string;
  readonly view: TargetView;
  readonly promise: Promise<CompileView>;
}

const defaultLoadCompile = (): Promise<CompileFunction> => import('@goiasscript/compiler/core').then((module) => module.compileCore);
const defaultLoadFormatter = (): Promise<ResultFormatter> => import('@goiasscript/compiler/format').then((module) => module.formatCompileResult);

// Sem o módulo de mensagens o marcador continua no lugar certo, só que com o aviso do playground.
function withoutMessages(core: CoreCompileResult, tone: Tone): CompileResult {
  const notice = hostDiagnostic('messagesFailure', tone);
  const diagnostics = core.diagnostics.map(({ code, severity, range }) => ({ ...notice, code, severity, range }));
  return { ...core, diagnostics };
}

interface FormattedResult {
  readonly result: CompileResult;
  readonly complete: boolean;
}

async function formatResult(core: CoreCompileResult, tone: Tone, loadFormatter: () => Promise<ResultFormatter>): Promise<FormattedResult> {
  if (core.diagnostics.length === 0) return { result: { ...core, diagnostics: [] }, complete: true };
  try {
    return { result: (await loadFormatter())(core, tone), complete: true };
  } catch {
    return { result: withoutMessages(core, tone), complete: false };
  }
}

export function createCompileService(options: CompileServiceOptions): CompileService {
  const loadCompiler = loadOnce(options.loadCompile ?? defaultLoadCompile);
  const loadFormatter = loadOnce(options.loadFormatter ?? defaultLoadFormatter);
  const loadOptimizer = loadOnce(options.loadOptimizer);
  const incomplete = new WeakSet<CompileView>();
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
    const { result, complete } = await formatResult((await loadCompiler())(source, compileOptions), options.tone, loadFormatter);
    const { markers, hiddenMarkerCount } = toEditorMarkers(result.diagnostics, source, lessonUrlOf);
    const built = await withGeneratedCode(result, view, markers, hiddenMarkerCount);
    if (!complete) incomplete.add(built);
    return built;
  }

  async function withGeneratedCode(result: CompileResult, view: TargetView, markers: readonly EditorMarker[], hiddenMarkerCount: number): Promise<CompileView> {
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
        if (built.markers[0] === OPTIMIZER_UNAVAILABLE_MARKER || incomplete.has(built)) forget();
      }, forget);
      return promise;
    },
  };
}
