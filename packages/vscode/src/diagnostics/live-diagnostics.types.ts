import type { CompileOptions, CompileResult } from '@goiasscript/compiler';
import type { ExtensionHost } from '../host/extension-host.types.ts';

export interface TimerApi {
  readonly set: (callback: () => void, delayMs: number) => unknown;
  readonly clear: (handle: unknown) => void;
}

export type CompileFn = (text: string, options: CompileOptions) => CompileResult | Promise<CompileResult>;

export interface LiveDiagnosticsOptions {
  readonly host: ExtensionHost;
  readonly timers: TimerApi;
  readonly compile?: CompileFn;
}

export interface PendingDocument {
  readonly version: number;
  readonly timer: unknown;
}
