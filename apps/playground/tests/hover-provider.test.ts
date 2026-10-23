import { describe, expect, it } from 'vitest';
import { provideHover } from '../lib/monaco/hover-provider.ts';

describe('provideHover', () => {
  it('uai mostra const', () => {
    const hover = provideHover('uai');
    expect(hover?.value).toContain('uai');
    expect(hover?.value).toContain('const');
  });

  it('se_ocê_quiser mostra if', () => {
    expect(provideHover('se_ocê_quiser')?.value).toContain('if');
  });

  it('reconhece a forma sem acento e a decomposta (NFD)', () => {
    expect(provideHover('se_oce_quiser')?.value).toContain('if');
    expect(provideHover('se_ocê_quiser'.normalize('NFD'))?.value).toContain('if');
  });

  it('identificador do usuário devolve null', () => {
    expect(provideHover('minhaVariavel')).toBeNull();
    expect(provideHover('')).toBeNull();
  });

  it('o conteúdo não é confiável e não aceita HTML', () => {
    const hover = provideHover('uai');
    expect(hover?.isTrusted).toBe(false);
    expect(hover?.supportHtml).toBe(false);
  });

  it('nunca ecoa HTML do programa', () => {
    expect(provideHover('<img src=x onerror=alert(1)>')).toBeNull();
    const hover = provideHover('uai', { lessonIdOf: () => '<script>', lessonUrlOf: () => '/cartilha/<script>' });
    expect(hover?.value).not.toContain('<script>');
  });

  it('inclui o link da lição só quando a lição existe', () => {
    const lessonIdOf = (term: string): string | undefined => (term === 'uai' ? 'licao-02' : undefined);
    const lessonUrlOf = (id: string): string | undefined => (id === 'licao-02' ? '/cartilha/licao-02' : undefined);
    expect(provideHover('uai', { lessonIdOf, lessonUrlOf })?.value).toContain('/cartilha/licao-02');
    expect(provideHover('uai', { lessonIdOf, lessonUrlOf: () => undefined })?.value).not.toContain('cartilha');
    expect(provideHover('uai')?.value).not.toContain('cartilha');
  });

  it('palavra da biblioteca mostra o equivalente em JS', () => {
    expect(provideHover('Coisa')?.value).toContain('Object');
  });
});
