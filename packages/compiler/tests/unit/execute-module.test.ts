import { describe, expect, it } from 'vitest';
import { executeModule } from '../support/execute-module.ts';

describe('execução determinística', () => {
  it('semeia Math.random e congela Date', async () => {
    expect(await executeModule('console.log(Math.random() === Math.random(), Date.now(), new Date().toISOString());\n', null)).toBe('false 1768478400000 2026-01-15T12:00:00.000Z\n');
    expect(await executeModule('console.log(Math.random());\n', null)).toBe(await executeModule('console.log(Math.random());\n', null));
  });
  it('alimenta o stdin do programa', async () => {
    expect(await executeModule("process.stdin.on('data', (chunk) => process.stdout.write(`eco:${chunk}`));\n", 'oi')).toBe('eco:oi');
  });
});
