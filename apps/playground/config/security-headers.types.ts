export interface HeaderEntry {
  readonly key: string;
  readonly value: string;
}

export interface HeaderRule {
  readonly source: string;
  readonly headers: readonly HeaderEntry[];
}
