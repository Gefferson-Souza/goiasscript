import { describe, expect, it, vi } from 'vitest';
import { remeasureWhenFontLoads } from '../lib/monaco/remeasure-fonts.ts';

describe('remedir o editor quando a fonte do código chega', () => {
  it('pede a fonte pelo nome e remede depois que ela carrega', async () => {
    const load = vi.fn(() => Promise.resolve([]));
    const remeasure = vi.fn();
    await remeasureWhenFontLoads({ load }, '"JetBrains Mono"', remeasure);
    expect(load).toHaveBeenCalledWith('16px "JetBrains Mono"');
    expect(remeasure).toHaveBeenCalledTimes(1);
  });

  it('se a fonte falhar, remede mesmo assim com a fonte de reserva', async () => {
    const load = vi.fn(() => Promise.reject(new Error('rede caiu')));
    const remeasure = vi.fn();
    await remeasureWhenFontLoads({ load }, 'mono', remeasure);
    expect(remeasure).toHaveBeenCalledTimes(1);
  });
});
