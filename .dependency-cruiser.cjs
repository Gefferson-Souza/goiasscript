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
    {
      name: 'vscode-nao-importa-cli-nem-apps',
      severity: 'error',
      comment: 'A extensão executa o CLI embutido como processo; nunca importa o pacote cli nem os apps.',
      from: { path: '(^|/)packages/vscode/src/' },
      to: { path: ['(^|/)packages/cli/', '(^|/)apps/'] },
    },
    {
      name: 'vscode-so-importa-workspace-e-vscode',
      severity: 'error',
      from: { path: '(^|/)packages/vscode/src/' },
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-unknown'], pathNot: '(^|/)node_modules/@types/vscode/' },
    },
    { name: 'sem-ciclos', severity: 'error', from: {}, to: { circular: true } },
    { name: 'sem-dependencia-de-runtime-no-compiler', severity: 'error', from: { path: '(^|/)packages/compiler/src/' }, to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-unknown'] } },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(node_modules|coverage|dist|generated|fixtures)/|(^|/)spikes/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: { exportsFields: ['exports'], conditionNames: ['import', 'require', 'node', 'default'] },
  },
};
