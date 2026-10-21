const ESLINT = 'eslint --max-warnings 0 --no-warn-ignored';

export default {
  '*.{ts,mts,mjs,cjs}': [ESLINT],
  '*.{ts,mts,mjs,cjs,json}': () => 'node tools/rules-scan/src/cli.mjs check',
  '*.{ts,mts}': () => 'tsc -p tsconfig.json',
};
