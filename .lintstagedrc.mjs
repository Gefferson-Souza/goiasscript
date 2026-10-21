const RULES_SCAN_CLI = 'tools/rules-scan/src/cli.mjs';

export default {
  '*.{ts,mts,mjs,cjs}': ['eslint --max-warnings 0 --no-warn-ignored'],
  '*.{ts,mts,mjs,cjs,json}': () => `node ${RULES_SCAN_CLI} check`,
  '*.{ts,mts}': () => 'tsc -p tsconfig.json',
};
