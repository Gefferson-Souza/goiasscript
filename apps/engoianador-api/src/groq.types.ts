export interface GroqCompletion {
  readonly choices?: readonly { readonly message?: { readonly content?: string } }[];
}
