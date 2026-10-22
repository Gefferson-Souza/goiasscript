import type { CliIo } from '../../src/io.types.ts';

export interface MemoryIoOptions {
  readonly files?: Readonly<Record<string, string | Uint8Array>>;
  readonly stdin?: string | Uint8Array;
  readonly platform?: NodeJS.Platform;
  readonly caseSensitive?: boolean;
  readonly nodeVersion?: string;
  readonly cwd?: string;
  readonly failingWrites?: readonly string[];
}

export interface MemoryIo extends CliIo {
  stdoutText(): string;
  stderrText(): string;
  fileText(path: string): string;
  fileBytes(path: string): Uint8Array;
  paths(): readonly string[];
}

export interface MemoryEntry {
  readonly displayPath: string;
  readonly id: number;
  readonly bytes: Uint8Array;
  readonly modifiedAt: number;
}
