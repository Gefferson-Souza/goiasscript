export type ReleaseDistTag = 'next' | 'latest';

export type ReleaseTarget =
  | { readonly ok: true; readonly version: string; readonly distTag: ReleaseDistTag }
  | { readonly ok: false; readonly reason: string };

export interface ReleaseTargetOptions {
  readonly changesetsPending: boolean;
}
