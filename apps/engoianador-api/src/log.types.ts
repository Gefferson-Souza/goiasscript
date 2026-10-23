export interface LogPort {
  warn(event: string, detail?: string): void;
  error(event: string, detail?: string): void;
}
