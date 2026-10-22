import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync } from 'node:zlib';
import { build } from 'esbuild';
import { acceptanceRates } from '../tests/support/acceptance.ts';
import { readCorpus } from '../tests/support/corpus.ts';
import { calibrationMs, measureBudgets, readRatchets } from './budgets.ts';

const SLACK = 1.25;
const FLOOR_MARGIN = 0.02;
const PERCENT = 100;
const ENTRY = fileURLToPath(new URL('../src/index.ts', import.meta.url));
const BUDGETS_FILE = new URL('./budgets.json', import.meta.url);

const floorOf = (rate: number): number => Math.max(0, Math.floor((rate - FLOOR_MARGIN) * PERCENT) / PERCENT);

const bundle = await build({ entryPoints: [ENTRY], bundle: true, minify: true, format: 'esm', platform: 'browser', write: false });
const brotliBytes = brotliCompressSync(Buffer.from(bundle.outputFiles[0]?.text ?? '')).length;
const { compile10kLinesMs, machineFactor } = measureBudgets();
const rates = acceptanceRates(readCorpus());
process.stdout.write(`${JSON.stringify({ compile10kLinesMs, machineFactor, brotliBytes, ...rates })}\n`);

if (process.argv.includes('--write')) {
  const ratchets = {
    compile10kLinesMs: Math.ceil(compile10kLinesMs * SLACK),
    brotliBytes: Math.ceil(brotliBytes * SLACK),
    acceptanceMutation: floorOf(rates.mutation),
    acceptanceProgram: floorOf(rates.programs),
    referenceCalibrationMs: calibrationMs(),
  };
  writeFileSync(BUDGETS_FILE, `${JSON.stringify(ratchets, null, 2)}\n`);
}
if (process.argv.includes('--check')) {
  const limits = readRatchets();
  const slow = limits.compile10kLinesMs !== null && compile10kLinesMs > limits.compile10kLinesMs;
  const large = limits.brotliBytes !== null && brotliBytes > limits.brotliBytes;
  if (slow || large) process.exit(1);
}
