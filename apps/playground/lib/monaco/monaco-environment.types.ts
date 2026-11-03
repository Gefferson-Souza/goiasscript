export type WorkerFactory = (url: string, options: WorkerOptions) => Worker;

export interface MonacoWorkerEnvironment {
  readonly getWorker: (moduleId: string, label: string) => Worker;
}
