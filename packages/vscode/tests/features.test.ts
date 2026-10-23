import { describe, expect, it } from 'vitest';
import { commandsFeature } from '../src/features/commands.feature.ts';
import { completionFeature } from '../src/features/completion.feature.ts';
import { diagnosticsFeature } from '../src/features/diagnostics.feature.ts';
import { hoverFeature } from '../src/features/hover.feature.ts';
import { createFakeHost } from './support/fake-host.ts';

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
});
