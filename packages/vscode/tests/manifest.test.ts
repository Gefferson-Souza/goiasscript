import { describe, expect, it } from 'vitest';
import { keybindingsOf, menusOf, readManifest } from './support/manifest.ts';

const manifest = readManifest();
const MIN_DESCRIPTION_LENGTH = 20;

describe('manifesto da extensão', () => {
  it('declara a extensão como pacote CommonJS com ativação por linguagem', () => {
    expect(manifest.name).toBe('goiasscript-vscode');
    expect(manifest.main).toBe('./dist/extension.cjs');
    expect(manifest.activationEvents).toEqual(['onLanguage:goiasscript']);
    expect(manifest.version).toMatch(/^0\.3\.\d+$/u);
  });

  it('respeita o Modo Restrito de forma limitada, com texto em goianês', () => {
    expect(manifest.capabilities.untrustedWorkspaces).toMatchObject({ supported: 'limited' });
    expect(manifest.capabilities.untrustedWorkspaces.description.length).toBeGreaterThan(MIN_DESCRIPTION_LENGTH);
  });

  it('o endereço das lições não vem de configuração de pasta não confiável', () => {
    expect(manifest.capabilities.untrustedWorkspaces.restrictedConfigurations).toContain('goiasscript.lessonBaseUrl');
  });

  it('não herda nada da extensão anterior', () => {
    for (const key of ['debuggers', 'themes', 'languagePacks', 'walkthroughs', 'viewsContainers']) {
      expect(manifest.contributes).not.toHaveProperty(key);
    }
    expect(manifest.dependencies).toBeUndefined();
  });

  it('executar o programa só aparece e só roda em workspace confiável de arquivo', () => {
    const runMenus = menusOf(manifest, 'goiasscript.run');
    expect(runMenus.length).toBeGreaterThan(0);
    for (const entry of runMenus) {
      expect(entry.when).toMatch(/isWorkspaceTrusted/u);
      expect(entry.when).toMatch(/resourceScheme == file/u);
    }
    const bindings = keybindingsOf(manifest, 'goiasscript.run');
    expect(bindings.length).toBeGreaterThan(0);
    for (const binding of bindings) expect(binding.when).toMatch(/isWorkspaceTrusted/u);
  });

  it('traduzir só aparece para arquivo, sem exigir confiança', () => {
    const translateMenus = menusOf(manifest, 'goiasscript.translate');
    expect(translateMenus.length).toBeGreaterThan(0);
    for (const entry of translateMenus) expect(entry.when).toMatch(/resourceScheme == file/u);
  });

  it('o piso do editor acompanha @types/vscode', () => {
    expect(manifest.engines.vscode).toBe(`^${manifest.devDependencies['@types/vscode'] ?? ''}`);
  });

  it('o publisher é um valor neutro, trocado no empacotamento', () => {
    expect(manifest.publisher).toBe('goiasscript');
  });
});
