import type { CompileOptions, CompileResult, CompileSuccess, OptimizeResult, Tone } from '@goiasscript/compiler';
import type { EditorMarker } from './diagnostic-markers.types.ts';

export type TargetView = 'didactic' | 'optimized';

export interface CompileView {
  readonly result: CompileResult;
  readonly generatedCode: string | null;
  readonly markers: readonly EditorMarker[];
  readonly hiddenMarkerCount: number;
}

export interface OptimizerModule {
  readonly optimize: (result: CompileSuccess, options: { readonly minify: boolean }) => Promise<OptimizeResult>;
}

export interface CompileServiceOptions {
  readonly tone: Tone;
  readonly loadOptimizer: () => Promise<OptimizerModule>;
  readonly compile?: (source: string, options?: CompileOptions) => CompileResult;
  readonly lessonUrlOf?: (lessonId: string) => string | undefined;
}

export interface CompileService {
  compile(source: string, view: TargetView): Promise<CompileView>;
}
