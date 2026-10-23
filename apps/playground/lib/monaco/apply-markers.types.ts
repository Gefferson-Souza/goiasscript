export interface MarkerTarget {
  setModelMarkers(model: unknown, owner: string, markers: readonly unknown[]): void;
}

export interface MarkerUriFactory {
  parse(value: string): unknown;
}
