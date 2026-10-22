export type NameCheck = { readonly ok: true } | { readonly ok: false; readonly detail: string };

export type ScaffoldFailure = {
  readonly ok: false;
  readonly code: 'GS0903' | 'GS0905';
  readonly detail: string;
  readonly args?: Readonly<Record<string, string>>;
};

export type ScaffoldResult = { readonly ok: true } | ScaffoldFailure;
