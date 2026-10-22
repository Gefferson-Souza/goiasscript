import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createNodeFileSystem } from '../node-file-system.ts';
import type { CliIo, OutputSink } from '../io.types.ts';

const STDOUT_FD = 1;
const STDERR_FD = 2;
const MAX_WRITE_ATTEMPTS = 1000;

const writeFully = (fileDescriptor: number, text: string): void => {
  const bytes = Buffer.from(text, 'utf8');
  let offset = 0;
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS && offset < bytes.length; attempt += 1) {
    try {
      offset += fs.writeSync(fileDescriptor, bytes, offset);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EAGAIN') throw error;
    }
  }
};

const sinkFor = (stream: NodeJS.WriteStream, fileDescriptor: number): OutputSink => ({
  write(text) {
    stream.write(text);
  },
  writeSync(text) {
    writeFully(fileDescriptor, text);
  },
});

const readAllFrom = async (input: NodeJS.ReadableStream): Promise<Uint8Array> => {
  let collected = Buffer.alloc(0);
  for await (const chunk of input) collected = Buffer.concat([collected, Buffer.from(chunk as Uint8Array)]);
  return collected;
};

export function createRealIo(): CliIo {
  return {
    out: sinkFor(process.stdout, STDOUT_FD),
    err: sinkFor(process.stderr, STDERR_FD),
    stdin: { readAll: () => readAllFrom(process.stdin), isTty: process.stdin.isTTY },
    streams: { input: process.stdin, output: process.stdout, isTty: process.stdin.isTTY && process.stdout.isTTY },
    fs: createNodeFileSystem(),
    env: {
      cwd: process.cwd(),
      tmpDir: os.tmpdir(),
      platform: process.platform,
      nodeVersion: process.versions.node,
      path,
      variables: process.env,
    },
  };
}
