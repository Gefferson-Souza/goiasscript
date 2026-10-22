import type { SOURCE_MAP_VERSION } from './source-map.constants.ts';

export interface SourceMapV3 {
  readonly version: typeof SOURCE_MAP_VERSION;
  readonly file: string;
  readonly sources: readonly string[];
  readonly sourcesContent: readonly string[];
  readonly names: readonly string[];
  readonly mappings: string;
}
