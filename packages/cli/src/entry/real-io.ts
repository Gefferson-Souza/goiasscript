import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createNodeFileSystem } from '../node-file-system.ts';
import { writeFully } from '../write-fully.ts';
import type { CliIo, OutputSink } from '../io.types.ts';

const STDOUT_FD = 1;
const STDERR_FD = 2;
// Em pipe ou arquivo o Node deixa isTTY indefinido, apesar do tipo dizer boolean.
const isTerminal = (flag: unknown): boolean => flag === true;

const writeToDescriptor = (fileDescriptor: number, text: string): void => {
  writeFully((bytes, offset) => fs.writeSync(fileDescriptor, bytes, offset), text);
};

const sinkFor = (stream: NodeJS.WriteStream, fileDescriptor: number): OutputSink => ({
  write(text) {
    stream.write(text);
  },
  writeSync(text) {
    writeToDescriptor(fileDescriptor, text);
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
    stdin: { readAll: () => readAllFrom(process.stdin), isTty: isTerminal(process.stdin.isTTY) },
    streams: { input: process.stdin, output: process.stdout, isTty: isTerminal(process.stdin.isTTY) && isTerminal(process.stdout.isTTY) },
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
