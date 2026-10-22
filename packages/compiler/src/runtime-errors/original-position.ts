import { decodeMappings } from '../sourcemap/vlq.ts';
import type { SourceMapV3 } from '../sourcemap/source-map.types.ts';

// line base 1 e column base 0 do JS gerado; devolve line base 0 e column base 0 do .gs, ou null sem origem.
export function originalPositionFor(map: SourceMapV3, line: number, column: number): { readonly line: number; readonly column: number } | null {
  const segments = decodeMappings(map.mappings)[line - 1] ?? [];
  const candidate = segments.filter((segment) => segment.generatedColumn <= column).at(-1);
  if (candidate === undefined || candidate.originalLine === null || candidate.originalColumn === null) return null;
  return { line: candidate.originalLine, column: candidate.originalColumn };
}
