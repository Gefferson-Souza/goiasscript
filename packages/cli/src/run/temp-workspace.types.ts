export interface TempWorkspace {
  readonly directory: string;
  readonly programPath: string;
  dispose(): boolean;
}
