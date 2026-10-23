export interface SmokeFailure {
  readonly path: string;
  readonly message: string;
}

export interface SmokeCheck {
  readonly path: string;
  readonly expectedStatus: number;
  readonly inspect: (response: Response, body: string) => readonly string[];
}

export interface SmokeCliIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
