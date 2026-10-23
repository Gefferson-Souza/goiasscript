export type BumpKind = 'none' | 'patch' | 'minor' | 'major';
export type Severity = 'error' | 'warning';

export interface ReservedName {
  readonly name: string;
  readonly source: string;
  readonly since: string;
  readonly deprecatedIn?: string;
}

export interface LockDiagnostic {
  readonly code: string;
  readonly severity: Severity;
}

export interface VocabularyLock {
  readonly reserved: readonly ReservedName[];
  readonly diagnostics: readonly LockDiagnostic[];
}

export interface BumpRequirement {
  readonly bump: BumpKind;
  readonly reasons: readonly string[];
}

export interface Changeset {
  readonly releases: Readonly<Record<string, BumpKind>>;
}

export interface GitPort {
  listTags(): Promise<readonly string[]>;
  readFile(ref: string, file: string): Promise<string | null>;
  listFiles(ref: string, directory: string): Promise<readonly string[]>;
}

export interface CompileOutcome {
  readonly ok: boolean;
}

export type CompileFn = (source: string) => CompileOutcome;

export interface ReplayResult {
  readonly id: string;
  readonly nowFails: boolean;
}

export interface CompatDeps {
  readonly git: GitPort;
  readonly currentTag: string | null;
  readonly currentLock: VocabularyLock;
  readonly changesets: readonly Changeset[];
  readonly manifestVersion?: string | null;
  readonly compile: CompileFn;
}

export interface CompatResult {
  readonly ok: boolean;
  readonly failures: readonly string[];
  readonly warnings: readonly string[];
}
