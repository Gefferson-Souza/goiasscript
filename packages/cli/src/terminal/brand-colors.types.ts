export interface ColorContext {
  readonly isTty: boolean;
  readonly variables: Readonly<Record<string, string | undefined>>;
}
