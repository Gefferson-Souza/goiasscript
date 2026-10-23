import path from 'node:path';
import { build } from 'esbuild';
import { SCENARIO_FILES } from './integration.constants.ts';

const SUITE_DIR_NAME = '.integration';
const SUITE_ENTRY_NAME = 'suite/index';
const COMPILED_EXTENSION = /\.cjs$/u;
const NODE_TARGET = 'node20';

// O VS Code 1.90 embute o Node 20; os testes são empacotados para o host de extensão como CommonJS.
export async function bundleSuite(extensionDir: string): Promise<string> {
  const outDir = path.join(extensionDir, SUITE_DIR_NAME);
  const testNames = [...new Set(Object.values(SCENARIO_FILES).flat())].map((file) => file.replace(COMPILED_EXTENSION, ''));
  const entryPoints = Object.fromEntries([
    [SUITE_ENTRY_NAME, path.join(extensionDir, 'tests/integration/suite/index.ts')],
    ...testNames.map((name) => [name, path.join(extensionDir, 'tests/integration', `${name}.ts`)] as const),
  ]);
  await build({
    absWorkingDir: extensionDir,
    entryPoints,
    outdir: outDir,
    outExtension: { '.js': '.cjs' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: NODE_TARGET,
    external: ['vscode', 'mocha'],
    sourcemap: false,
    logLevel: 'warning',
  });
  return path.join(outDir, `${SUITE_ENTRY_NAME}.cjs`);
}
