export interface GateProblem {
  readonly file: string;
  readonly message: string;
}

export interface UiString {
  readonly source: string;
  readonly text: string;
  readonly diagnosticCode?: string;
}

export type ForbiddenScope = 'engine' | 'ui';

export interface ForbiddenEntry {
  readonly pattern: string;
  readonly flags?: string;
  readonly scope: ForbiddenScope;
  readonly reason: string;
}

export type AllowEntry =
  | { readonly kind: 'proper-name'; readonly text: string; readonly reason: string }
  | { readonly kind: 'quoted-in-diagnostic'; readonly codePrefix: string; readonly reason: string }
  | { readonly kind: 'emitted-code'; readonly source: string; readonly reason: string };

export interface EnglishRules {
  readonly forbidden: readonly ForbiddenEntry[];
  readonly allowlist: readonly AllowEntry[];
}

export type ProofKind = 'test' | 'workflow' | 'script';
export type TraceabilityState = 'green' | 'ready' | 'missing';

export interface TraceabilityProof {
  readonly kind: ProofKind;
  readonly path: string;
  readonly name?: string;
}

export interface TraceabilityEntry {
  readonly promise: string;
  readonly proofs: readonly TraceabilityProof[];
  readonly state: TraceabilityState;
  readonly note?: string;
}

export interface TraceabilityFs {
  readonly exists: (file: string) => boolean;
  readonly read: (file: string) => string;
}

export interface PackageManifest {
  readonly name: string;
  readonly dependencies?: Readonly<Record<string, string>>;
  readonly optionalDependencies?: Readonly<Record<string, string>>;
  readonly peerDependencies?: Readonly<Record<string, string>>;
}

export interface CompilerPackages {
  readonly manifests: readonly PackageManifest[];
  readonly sources: Readonly<Record<string, string>>;
}

export interface GateIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}

export interface GateMessages {
  readonly failure: (count: number) => string;
  readonly success: string;
}
