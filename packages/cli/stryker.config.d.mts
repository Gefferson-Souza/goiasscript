declare const config: {
  readonly incremental: boolean;
  readonly mutate: readonly string[];
  readonly thresholds: { readonly high: number; readonly low: number; readonly break: number | null };
};
export default config;
