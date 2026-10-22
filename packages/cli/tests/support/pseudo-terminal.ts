import { PassThrough } from 'node:stream';
import { stripVTControlCharacters } from 'node:util';
import type { Tone } from '@goiasscript/compiler';
import type { ExitCode } from '../../src/exit-codes.types.ts';
import type { ReplOptions } from '../../src/repl/repl.types.ts';
import { runRepl } from '../../src/repl/run-repl.ts';
import { createMemoryIo } from './memory-io.ts';
import type { PressedKey, PseudoTerminal } from './pseudo-terminal.types.ts';

const KEY_BYTES: Readonly<Record<PressedKey, string>> = { tab: '\t', 'ctrl-c': '\u0003', 'ctrl-d': '\u0004' };
const STABLE_ROUNDS = 6;
const MAX_ROUNDS = 200;
const nextTurn = (): Promise<void> => new Promise((resolve) => void setImmediate(resolve));

export function createPseudoTerminal(tone: Tone = 'raiz', extra: Partial<ReplOptions> = {}): PseudoTerminal {
  const input = new PassThrough();
  const output = new PassThrough();
  const chunks: string[] = [];
  output.on('data', (chunk: Buffer) => void chunks.push(chunk.toString('utf8')));
  const base = createMemoryIo();
  const io = {
    ...base,
    out: { write: (text: string) => void output.write(text), writeSync: (text: string) => void output.write(text) },
    err: { write: (text: string) => void output.write(text), writeSync: (text: string) => void output.write(text) },
    streams: { input, output, isTty: true },
  };
  let closed = false;
  const exitCode: Promise<ExitCode> = runRepl(io, { tone, ...extra }).then((code) => {
    closed = true;
    return code;
  });
  const screen = (): string => stripVTControlCharacters(chunks.join('')).replaceAll('\r\n', '\n').replaceAll('\r', '');
  return {
    io,
    exitCode,
    type: (text) => void input.write(text),
    press: (key) => void input.write(KEY_BYTES[key]),
    screen,
    closedYet: () => closed,
    async settled() {
      let stable = 0;
      let seen = chunks.length;
      for (let round = 0; round < MAX_ROUNDS && stable < STABLE_ROUNDS; round += 1) {
        await nextTurn();
        stable = chunks.length === seen ? stable + 1 : 0;
        seen = chunks.length;
      }
    },
  };
}
