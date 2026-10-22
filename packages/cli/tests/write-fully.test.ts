import { describe, expect, it } from 'vitest';
import { writeFully } from '../src/write-fully.ts';

const noWait = (): undefined => undefined;

const eagain = (): NodeJS.ErrnoException => Object.assign(new Error('again'), { code: 'EAGAIN' });

describe('writeFully', () => {
  it('escreve tudo mesmo quando o descritor aceita só parte dos bytes', () => {
    const chunks: string[] = [];
    writeFully((bytes, offset) => {
      chunks.push(Buffer.from(bytes.subarray(offset, offset + 2)).toString());
      return 2;
    }, 'abcde', noWait);
    expect(chunks.join('')).toBe('abcde');
  });

  it('espera e tenta de novo quando recebe EAGAIN', () => {
    let calls = 0;
    let waits = 0;
    writeFully((bytes) => {
      calls += 1;
      if (calls < 3) throw eagain();
      return bytes.length;
    }, 'oi', () => { waits += 1; });
    expect(waits).toBe(2);
  });

  it('lança erro quando as tentativas acabam sem escrever tudo', () => {
    const stuck = (): number => { throw eagain(); };
    expect(() => { writeFully(stuck, 'oi', noWait); }).toThrow(/Ô sô/);
  });

  it('propaga erros que não são EAGAIN', () => {
    const broken = Object.assign(new Error('quebrou'), { code: 'EPIPE' });
    const failing = (): number => { throw broken; };
    expect(() => { writeFully(failing, 'oi', noWait); }).toThrow('quebrou');
  });
});
