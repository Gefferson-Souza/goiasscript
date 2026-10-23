export interface FakeNamespace {
  readonly namespace: DurableObjectNamespace;
  readonly objectNames: () => readonly string[];
  readonly fetchCount: () => number;
}

export interface FakeNamespaceOptions {
  readonly failWith?: Error;
}
