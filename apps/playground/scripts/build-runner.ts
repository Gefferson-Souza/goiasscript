import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import type { BuildRunnerOptions } from './build-runner.types.ts';

const APP_ROOT = path.join(import.meta.dirname, '..');
const RUNNER_ENTRY = path.join(APP_ROOT, 'sandbox/runner.ts');
const DEFAULT_OUT_FILE = path.join(APP_ROOT, 'public/sandbox/runner.js');
// Piso de navegadores do playground (Chrome/Edge 110, Firefox 115, Safari 16).
const BROWSER_TARGETS = ['chrome110', 'firefox115', 'safari16'];

export async function buildRunner(options: BuildRunnerOptions): Promise<void> {
  await build({
    entryPoints: [RUNNER_ENTRY],
    outfile: path.resolve(options.outFile),
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: BROWSER_TARGETS,
    charset: 'utf8',
    minify: false,
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'warning',
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildRunner({ outFile: DEFAULT_OUT_FILE });
}
