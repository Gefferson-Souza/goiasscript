import { describe, expect, it } from 'vitest';
import { readSettings } from '../src/settings/settings.ts';

describe('readSettings', () => {
  it('devolve os padrões quando nada está configurado', () => {
    expect(readSettings({})).toEqual({ tone: 'raiz', diagnosticsDelayMs: 300, lessonBaseUrl: null });
  });

  it('aceita o tom neutro', () => {
    expect(readSettings({ tone: 'neutro' }).tone).toBe('neutro');
  });

  it('cai para raiz quando o tom é inválido', () => {
    expect(readSettings({ tone: 'caipira' }).tone).toBe('raiz');
    expect(readSettings({ tone: 7 }).tone).toBe('raiz');
  });

  it('limita o atraso entre 0 e 5000', () => {
    expect(readSettings({ diagnosticsDelayMs: -10 }).diagnosticsDelayMs).toBe(0);
    expect(readSettings({ diagnosticsDelayMs: 99_999 }).diagnosticsDelayMs).toBe(5000);
    expect(readSettings({ diagnosticsDelayMs: 750 }).diagnosticsDelayMs).toBe(750);
  });

  it('usa o atraso padrão quando o valor não é número', () => {
    expect(readSettings({ diagnosticsDelayMs: 'rápido' }).diagnosticsDelayMs).toBe(300);
    expect(readSettings({ diagnosticsDelayMs: Number.NaN }).diagnosticsDelayMs).toBe(300);
  });

  it('arredonda atraso fracionário', () => {
    expect(readSettings({ diagnosticsDelayMs: 100.6 }).diagnosticsDelayMs).toBe(101);
  });

  it('só vale endereço de lição com https', () => {
    expect(readSettings({ lessonBaseUrl: 'https://cartilha.exemplo.dev/licoes' }).lessonBaseUrl).toBe('https://cartilha.exemplo.dev/licoes');
    expect(readSettings({ lessonBaseUrl: 'http://cartilha.exemplo.dev' }).lessonBaseUrl).toBeNull();
    expect(readSettings({ lessonBaseUrl: 'javascript:alert(1)' }).lessonBaseUrl).toBeNull();
    expect(readSettings({ lessonBaseUrl: 'não é endereço' }).lessonBaseUrl).toBeNull();
    expect(readSettings({ lessonBaseUrl: 42 }).lessonBaseUrl).toBeNull();
  });
});
