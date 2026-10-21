const PACKAGE_LAYERS = ['language', 'compiler', 'optimizer', 'cli', 'vscode'];
const above = (layer) => PACKAGE_LAYERS.slice(PACKAGE_LAYERS.indexOf(layer) + 1).map((name) => `packages/${name}/`);
const layerRule = (layer) => ({
  name: `${layer}-nao-importa-camada-acima`,
  severity: 'error',
  comment: 'Camadas: language <- compiler <- optimizer <- cli/vscode/apps (spec 5.1).',
  from: { path: `(^|/)packages/${layer}/` },
  to: { path: [...above(layer), '(^|/)apps/'] },
});

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    ...['language', 'compiler', 'optimizer'].map(layerRule),
    { name: 'isomorfico-sem-node', severity: 'error', from: { path: '(^|/)packages/(language|compiler)/src/' }, to: { dependencyTypes: ['core'] } },
    { name: 'sem-ciclos', severity: 'error', from: {}, to: { circular: true } },
    { name: 'sem-dependencia-de-runtime-no-compiler', severity: 'error', from: { path: '(^|/)packages/compiler/src/' }, to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-unknown'] } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|coverage|dist|generated|fixtures)/|(^|/)packages/core/|(^|/)vscode-extension/|(^|/)lsp-server/|(^|/)spikes/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
  },
};
