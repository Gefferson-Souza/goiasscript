import manifest from '../package.json' with { type: 'json' };

export const VERSION: string = manifest.version;
