import type { EditorMarker } from '../diagnostic-markers.types.ts';
import type { MarkerTarget, MarkerUriFactory } from './apply-markers.types.ts';
import { MARKER_OWNER } from './monaco-assets.ts';

// A lição vira link no código do marcador: o texto do diagnóstico continua texto puro.
export function applyMarkers(
  editorApi: MarkerTarget,
  uri: MarkerUriFactory,
  model: unknown,
  markers: readonly EditorMarker[],
): void {
  editorApi.setModelMarkers(
    model,
    MARKER_OWNER,
    markers.map(({ lessonUrl, code, ...rest }) => ({
      ...rest,
      code: lessonUrl === undefined ? code : { value: code, target: uri.parse(lessonUrl) },
    })),
  );
}
