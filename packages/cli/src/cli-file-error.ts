import type { FileErrorCode } from './io.types.ts';

export class CliFileError extends Error {
  readonly code: FileErrorCode;

  constructor(code: FileErrorCode, path: string) {
    super(`${code}: ${path}`);
    this.name = 'CliFileError';
    this.code = code;
  }
}
