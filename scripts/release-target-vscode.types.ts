export type VscodeReleaseTarget =
  | { readonly ok: true; readonly version: string; readonly preRelease: boolean }
  | { readonly ok: false; readonly reason: string };
