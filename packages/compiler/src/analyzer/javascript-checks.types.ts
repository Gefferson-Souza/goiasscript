export interface MemberAccessQuery {
  readonly name: string;
  readonly start: number;
  readonly end: number;
  readonly declared: ReadonlySet<string>;
  readonly namespace?: string;
}
