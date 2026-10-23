import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { checkWranglerConfig } from './wrangler-check.ts';

const WRANGLER_URL = new URL('../wrangler.toml', import.meta.url);
const FAILURE_EXIT_CODE = 1;

const problems = checkWranglerConfig(readFileSync(fileURLToPath(WRANGLER_URL), 'utf8'));
if (problems.length > 0) {
  process.stderr.write(`Ô rapaz, o wrangler.toml não tá pronto pro deploy:\n${problems.map((problem) => `- ${problem}`).join('\n')}\n`);
  process.exit(FAILURE_EXIT_CODE);
}
process.stdout.write('Tá pronto, sô: o wrangler.toml está completo.\n');
