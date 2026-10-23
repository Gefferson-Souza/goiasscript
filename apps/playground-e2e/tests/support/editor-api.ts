import type { Page } from '@playwright/test';
import type { ModelMarker } from './editor-api.types.ts';

interface MonacoGlobal {
  readonly editor: { readonly getModelMarkers: (filter: Record<string, never>) => readonly ModelMarker[] };
}

// O Monaco publica `monaco` em window ao carregar; é a única fonte confiável das colunas dos marcadores.
export async function readModelMarkers(page: Page): Promise<readonly ModelMarker[]> {
  return page.evaluate(() => {
    const monaco = (window as unknown as { monaco?: MonacoGlobal }).monaco;
    if (monaco === undefined) {
      throw new Error('window.monaco não existe: o carregador do Monaco mudou e os marcadores não dá pra ler.');
    }
    return monaco.editor.getModelMarkers({});
  });
}
