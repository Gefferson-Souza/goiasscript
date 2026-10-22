export type SourceInput =
  | { readonly kind: 'file'; readonly path: string; readonly displayName: string }
  | { readonly kind: 'stdin'; readonly displayName: string };

export type PathFailureCode = 'GS0902' | 'GS0903' | 'GS0905';

export interface PathFailure {
  readonly ok: false;
  readonly code: PathFailureCode;
  readonly detail: string;
  readonly args?: Readonly<Record<string, string>>;
}

export type InputNameResult = { readonly ok: true; readonly outputStem: string } | PathFailure;

export type OutputPlan = { readonly ok: true; readonly outputPath: string; readonly replacing: boolean } | PathFailure;

export interface OutputRequest {
  readonly inputPath: string;
  readonly outputStem: string;
  readonly outputOption?: string;
  readonly overwrite: boolean;
  readonly override: string;
}

export type DecodedSource = { readonly ok: true; readonly text: string } | { readonly ok: false; readonly detail: string };

export type SourceRead = { readonly ok: true; readonly input: SourceInput; readonly bytes: Uint8Array } | PathFailure;
