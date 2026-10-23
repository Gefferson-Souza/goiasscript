import { describe, expect, it } from 'vitest';
import { commandsFeature } from '../src/features/commands.feature.ts';
import { completionFeature } from '../src/features/completion.feature.ts';
import { diagnosticsFeature } from '../src/features/diagnostics.feature.ts';
import { hoverFeature } from '../src/features/hover.feature.ts';
import { createFakeHost } from './support/fake-host.ts';
import type { FakeTerminal } from './support/fake-host.types.ts';

const features = [
  ['diagnósticos', diagnosticsFeature],
  ['autocomplete', completionFeature],
  ['hover', hoverFeature],
  ['comandos', commandsFeature],
] as const;

describe('features da extensão', () => {
  it.each(features)('%s ativa contra o host injetado e descarta sem erro', (_title, feature) => {
    const host = createFakeHost();
    const disposable = feature.activate(host);
    expect(() => {
      disposable.dispose();
    }).not.toThrow();
  });
});

describe('host de teste', () => {
  it('guarda diagnósticos, erros e saída para as features conferirem', () => {
    const host = createFakeHost({ trusted: false });
    expect(host.isWorkspaceTrusted()).toBe(false);
    host.showError('deu ruim');
    host.appendOutput('prosa');
    host.setDiagnostics('file:///a.gs', []);
    expect(host.errors).toEqual(['deu ruim']);
    expect(host.output).toEqual(['prosa']);
    expect(host.diagnostics.get('file:///a.gs')).toEqual([]);
    host.clearDiagnostics('file:///a.gs');
    expect(host.diagnostics.has('file:///a.gs')).toBe(false);
  });

  it('entrega eventos de documento e de confiança aos assinantes', () => {
    const host = createFakeHost();
    const kinds: string[] = [];
    let granted = 0;
    host.onDocumentEvent((event) => kinds.push(event.kind));
    host.onTrustGranted(() => (granted += 1));
    host.emit({ kind: 'opened', document: host.makeDocument({}) });
    host.grantTrust();
    expect(kinds).toEqual(['opened']);
    expect(granted).toBe(1);
    expect(host.isWorkspaceTrusted()).toBe(true);
  });

  it('registra comandos e responde à confirmação configurada', async () => {
    const host = createFakeHost({ confirmation: true });
    let ran = false;
    host.registerCommand('goiasscript.run', () => {
      ran = true;
      return Promise.resolve();
    });
    await host.commands.get('goiasscript.run')?.();
    expect(ran).toBe(true);
    expect(await host.askConfirmation('certeza?', 'sim')).toBe(true);
  });

  it('entrega ao comando o arquivo clicado, sem perder o caso da paleta', async () => {
    const host = createFakeHost();
    const received: (string | undefined)[] = [];
    host.registerCommand('goiasscript.translate', (resourceUri) => {
      received.push(resourceUri);
      return Promise.resolve();
    });
    await host.commands.get('goiasscript.translate')?.('file:///work/clicado.gs');
    await host.commands.get('goiasscript.translate')?.();
    expect(received).toEqual(['file:///work/clicado.gs', undefined]);
  });

  it('limpa sequências de escape do aviso e do canal, mas deixa a saída do programa intacta', () => {
    const escape = String.fromCharCode(0x1b);
    const host = createFakeHost();
    const terminal = host.openProgramTerminal('programa') as FakeTerminal;
    terminal.write(`${escape}[32mverde`);
    terminal.writeNotice(`${escape}]0;falso\u0007erro`);
    host.appendOutput(`${escape}[2Jlimpou`);
    expect(terminal.written).toEqual([`${escape}[32mverde`, ']0;falsoerro']);
    expect(host.output).toEqual(['[2Jlimpou']);
  });
});
