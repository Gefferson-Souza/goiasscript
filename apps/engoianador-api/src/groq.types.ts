export interface GroqCompletion {
  readonly choices?: readonly { readonly message?: { readonly content?: string } }[];
}

export interface GroqErrorBody {
  readonly error?: { readonly code?: string };
}

export interface GroqModelEntry {
  readonly id: string;
  readonly active?: boolean;
}

export interface GroqModelList {
  readonly data?: readonly GroqModelEntry[];
}
