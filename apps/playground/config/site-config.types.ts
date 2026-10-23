export type BuildMode = 'development' | 'production';

export interface SiteConfig {
  readonly siteUrl: string | null;
  readonly engoianadorUrl: string | null;
  readonly donation: {
    readonly pixKey: string | null;
    readonly sponsorsUrl: string | null;
    readonly kofiUrl: string | null;
  };
  readonly contactUrl: string | null;
}
