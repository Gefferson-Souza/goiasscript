export interface LinkFailure {
  readonly label: string;
  readonly reason: string;
}

export interface PublicConfigIo {
  readonly out: (text: string) => void;
  readonly err: (text: string) => void;
}
