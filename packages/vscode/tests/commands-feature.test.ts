import { describe, expect, it } from 'vitest';
import { nodeExecFile } from '../src/commands/node-exec-file.ts';
import { commandsFeature, RUN_COMMAND_ID, TRANSLATE_COMMAND_ID } from '../src/features/commands.feature.ts';
import { createFakeHost } from './support/fake-host.ts';

describe('commandsFeature', () => {
  it('registra os dois comandos e os remove ao descartar', () => {
    const host = createFakeHost();
    const disposable = commandsFeature.activate(host);
    expect([...host.commands.keys()].sort()).toEqual([RUN_COMMAND_ID, TRANSLATE_COMMAND_ID].sort());
    disposable.dispose();
    expect(host.commands.size).toBe(0);
  });

  it('recusa documento que não é .gs sem executar processo', async () => {
    const host = createFakeHost({ activeDocument: createFakeHost().makeDocument({ languageId: 'javascript' }) });
    commandsFeature.activate(host);
    await host.commands.get(TRANSLATE_COMMAND_ID)?.();
    await host.commands.get(RUN_COMMAND_ID)?.();
    expect(host.errors).toHaveLength(2);
    expect(host.terminals).toHaveLength(0);
  });
});

describe('nodeExecFile', () => {
  it('executa o processo de verdade, por lista de argumentos e sem shell', async () => {
    const result = await new Promise<{ error: Error | null; stdout: string }>((resolve) => {
      nodeExecFile(process.execPath, ['-e', 'process.stdout.write(process.argv[1])', '--', 'a b;c'], { cwd: process.cwd(), env: process.env, windowsHide: true, maxBuffer: 1024 }, (error, stdout) => {
        resolve({ error, stdout });
      });
    });
    expect(result.error).toBeNull();
    expect(result.stdout).toBe('a b;c');
  });
});
