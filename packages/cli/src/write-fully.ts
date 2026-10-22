import type { WriteChunk } from './write-fully.types.ts';

const MAX_WRITE_ATTEMPTS = 1000;
const RETRY_WAIT_MS = 1;
const INT32_BYTES = 4;

const sleepSynchronously = (milliseconds: number): void => {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(INT32_BYTES)), 0, 0, milliseconds);
};

export function writeFully(
  writeChunk: WriteChunk,
  text: string,
  wait: (milliseconds: number) => void = sleepSynchronously,
): void {
  const bytes = Buffer.from(text, 'utf8');
  let offset = 0;
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS && offset < bytes.length; attempt += 1) {
    try {
      offset += writeChunk(bytes, offset);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EAGAIN') throw error;
      wait(RETRY_WAIT_MS);
    }
  }
  if (offset < bytes.length) {
    throw new Error('Ô sô! O cano entupiu e a saída não coube toda.');
  }
}
