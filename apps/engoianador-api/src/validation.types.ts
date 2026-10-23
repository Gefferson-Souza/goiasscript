export type RejectionStatus = 400 | 411 | 413 | 415;

export type ParsedRequest =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly status: RejectionStatus; readonly error: string };
