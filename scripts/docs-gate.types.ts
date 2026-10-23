import type { CompileResult } from '../packages/compiler/src/index.ts';

export type DocExpectation = 'runs' | 'compiles-only' | 'expected-error' | 'misspelled-language';

export interface DocBlock {
  readonly file: string;
  readonly line: number;
  readonly code: string;
  readonly expectation: DocExpectation;
  readonly expectedCode?: string;
  readonly stdin?: string;
}

export interface DocProblem {
  readonly file: string;
  readonly line: number;
  readonly message: string;
}

export interface DocRunResult {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number | null;
  readonly timedOut: boolean;
}

export interface DocBlockDeps {
  readonly compile: (source: string) => CompileResult;
  readonly run: (code: string, stdin: string) => Promise<DocRunResult>;
}

export interface DocMentions {
  readonly commands: readonly string[];
  readonly words: readonly string[];
}

export interface LocatedMention {
  readonly name: string;
  readonly line: number;
}

export interface LocatedMentions {
  readonly commands: readonly LocatedMention[];
  readonly words: readonly LocatedMention[];
}

export interface DocFile {
  readonly file: string;
  readonly text: string;
}

export interface AllowlistEntry {
  readonly word: string;
  readonly reason: string;
}

export interface CommandRegistry {
  readonly commands: ReadonlySet<string>;
  readonly flags: ReadonlySet<string>;
  readonly binaries: ReadonlySet<string>;
  readonly languageWords: ReadonlySet<string>;
  readonly allowlist: readonly AllowlistEntry[];
}
