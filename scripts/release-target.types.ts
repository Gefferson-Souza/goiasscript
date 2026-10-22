export type ReleaseTarget =
  | { readonly ok: true; readonly version: string; readonly distTag: 'next' }
  | { readonly ok: false; readonly reason: string };
