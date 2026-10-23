import { describe, expect, it, vi } from 'vitest';
import { warmCache } from '../scripts/warm-cache';
import { PRESETS } from '../../playground/app/engoianador/engoianador.constants';

const API = 'https://api.exemplo';

describe('warmCache', () => {
  it('envia as cinco frases prontas e relata falha sem abortar', async () => {
    const sent: string[] = [];
    const fetchFn = vi.fn((url: string, init: RequestInit): Promise<Response> => {
      expect(url).toBe(`${API}/engoiana`);
      const body = typeof init.body === 'string' ? init.body : '{}';
      const { text } = JSON.parse(body) as { text: string };
      sent.push(text);
      if (sent.length === 2) return Promise.reject(new TypeError('rede caiu'));
      if (sent.length === 3) return Promise.resolve(new Response('{}', { status: 502 }));
      return Promise.resolve(new Response('{"text":"uai"}', { status: 200 }));
    });
    const report = await warmCache({ baseUrl: API, fetchFn });
    expect(PRESETS).toHaveLength(5);
    expect(sent).toEqual(PRESETS.map((preset) => preset.text));
    expect(report.warmed).toBe(3);
    expect(report.failed).toHaveLength(2);
  });

  it('recusa endereço que não é https', async () => {
    const fetchFn = vi.fn();
    await expect(warmCache({ baseUrl: 'http://api.exemplo', fetchFn })).rejects.toThrow(/https/u);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
