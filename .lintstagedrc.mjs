import { existsSync } from 'node:fs';

const ESLINT_CONFIGS = ['eslint.config.mjs', 'eslint.config.js', 'eslint.config.ts'];
const RULES_SCAN_CLI = 'tools/rules-scan/src/cli.mjs';

const hasEslint = ESLINT_CONFIGS.some((file) => existsSync(file));
const hasRulesScan = existsSync(RULES_SCAN_CLI);

// Cada verificação só entra quando a ferramenta existe no checkout, senão o pre-commit quebra branches anteriores à sua chegada.
export default {
  ...(hasEslint && { '*.{ts,mts,mjs,cjs}': ['eslint --max-warnings 0 --no-warn-ignored'] }),
  ...(hasRulesScan && { '*.{ts,mts,mjs,cjs,json}': () => `node ${RULES_SCAN_CLI} check` }),
  '*.{ts,mts}': () => 'tsc -p tsconfig.json',
};
