export interface OutputSink {
  write(text: string): void;
  writeSync(text: string): void;
}

export interface InputSource {
  readAll(): Promise<Uint8Array>;
  readonly isTty: boolean;
}

export type PathKind = 'file' | 'directory' | 'other' | 'missing';

export type FileErrorCode = 'EEXIST' | 'ENOENT' | 'EACCES' | 'EISDIR' | 'ENOTDIR' | 'OTHER';

export type WriteMode = 'create-new' | 'replace';

export interface CliFileSystem {
  readBytes(path: string): Promise<Uint8Array>;
  stat(path: string): Promise<PathKind>;
  identity(path: string): Promise<string | null>;
  writeText(path: string, content: string, mode: WriteMode): Promise<void>;
  makeDirectory(path: string): Promise<void>;
  makeTempDirectory(prefix: string): Promise<string>;
  listDirectory(path: string): Promise<readonly string[]>;
  modifiedAt(path: string): Promise<number>;
  remove(path: string): Promise<void>;
  removeSync(path: string): void;
}

export interface CliEnvironment {
  readonly cwd: string;
  readonly tmpDir: string;
  readonly platform: NodeJS.Platform;
  readonly nodeVersion: string;
  readonly path: import('node:path').PlatformPath;
  readonly variables: Readonly<Record<string, string | undefined>>;
}

export interface TerminalStreams {
  readonly input: NodeJS.ReadableStream;
  readonly output: NodeJS.WritableStream;
  readonly isTty: boolean;
}

export interface CliIo {
  readonly out: OutputSink;
  readonly err: OutputSink;
  readonly stdin: InputSource;
  readonly streams: TerminalStreams;
  readonly fs: CliFileSystem;
  readonly env: CliEnvironment;
}
