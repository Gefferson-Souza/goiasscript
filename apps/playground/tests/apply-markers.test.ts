import { describe, expect, it } from 'vitest';
import type { EditorMarker } from '../lib/diagnostic-markers.types.ts';
import { applyMarkers } from '../lib/monaco/apply-markers.ts';

const base = { severity: 8, message: 'm', startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 2 } as const;

describe('marcadores no Monaco', () => {
  it('troca os marcadores do dono e liga a lição ao código', () => {
    const calls: unknown[][] = [];
    const markers: EditorMarker[] = [
      { ...base, code: 'GS0301', lessonUrl: '/licoes/variaveis' },
      { ...base, code: 'GS0302' },
    ];
    applyMarkers(
      { setModelMarkers: (...args) => calls.push(args) },
      { parse: (value) => ({ uri: value }) },
      'modelo',
      markers,
    );
    expect(calls).toEqual([
      [
        'modelo',
        'goiasscript',
        [
          { ...base, code: { value: 'GS0301', target: { uri: '/licoes/variaveis' } } },
          { ...base, code: 'GS0302' },
        ],
      ],
    ]);
  });

  it('lista vazia limpa os marcadores', () => {
    const calls: unknown[][] = [];
    applyMarkers({ setModelMarkers: (...args) => calls.push(args) }, { parse: () => null }, 'm', []);
    expect(calls[0]?.[2]).toEqual([]);
  });
});
