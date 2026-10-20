import { spawnSync } from 'node:child_process';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { cpus, platform } from 'node:os';
import { join } from 'node:path';
import { brotliCompressSync, constants } from 'node:zlib';
import { build } from 'esbuild';
import { compile } from '../src/compile.ts';
import { generateProgram } from './generate-10k.ts';

const ROOT = join(import.meta.dirname, '..');
const REQUIRED_NODE_MAJOR = 24;
const median = (values: number[]): number => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] ?? 0;
const WARMUP_RUNS = 2;
const MEASURED_RUNS = 20;
const TABLE_FILES = new Set(['vocabulary.constants.ts']);
const REPORT_PATH = join(ROOT, '..', '..', 'docs', 'fase-0', 'medicao-poc.json');
const ADR_PATH = join(ROOT, '..', '..', 'docs', 'adr', '0001-front-end-proprio-a-mao.md');

interface Limits { readonly maxSourceLines: number; readonly maxBrotliBytes: number; readonly maxMillisecondsFor10kLines: number; readonly maxProjectedDays: number }

function readLimits(): Limits {
  const block = /```json limits\n([\s\S]*?)\n```/.exec(readFileSync(ADR_PATH, 'utf8'));
  if (!block?.[1]) throw new Error('ADR-0001 sem o bloco "json limits"');
  return JSON.parse(block[1]) as Limits;
}

const countNonBlankLines = (path: string): number => readFileSync(path, 'utf8').split('\n').filter((line) => line.trim() !== '').length;

function countSourceLines(): { sourceLines: number; tableLines: number; files: Record<string, number> } {
  const names = readdirSync(join(ROOT, 'src')).filter((name) => name.endsWith('.ts'));
  const files = Object.fromEntries(names.map((name) => [name, countNonBlankLines(join(ROOT, 'src', name))]));
  const sum = (wanted: boolean): number => names.filter((name) => TABLE_FILES.has(name) === wanted).reduce((total, name) => total + (files[name] ?? 0), 0);
  return { sourceLines: sum(false), tableLines: sum(true), files };
}

async function measureBrotli(): Promise<{ minifiedBytes: number; brotliBytes: number }> {
  const bundle = await build({ entryPoints: [join(ROOT, 'src', 'compile.ts')], bundle: true, minify: true, format: 'esm', platform: 'browser', write: false });
  const code = Buffer.from(bundle.outputFiles[0]?.contents ?? new Uint8Array());
  const brotli = brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: constants.BROTLI_MAX_QUALITY } });
  return { minifiedBytes: code.length, brotliBytes: brotli.length };
}

function measureCompileMilliseconds(): { medianMs: number; runsMs: number[] } {
  const program = generateProgram();
  const runsMs: number[] = [];
  for (let run = 0; run < WARMUP_RUNS + MEASURED_RUNS; run += 1) {
    const started = performance.now();
    const result = compile(program);
    const elapsed = performance.now() - started;
    if (!result.ok) throw new Error(`o programa gerado não compilou: ${result.diagnostics[0]?.code ?? '?'}`);
    if (run >= WARMUP_RUNS) runsMs.push(elapsed);
  }
  return { medianMs: median(runsMs), runsMs };
}

function countLintViolations(): Record<string, number> {
  const eslint = join(ROOT, 'node_modules', 'eslint', 'bin', 'eslint.js');
  const run = spawnSync(process.execPath, [eslint, 'src', '--format', 'json'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const files = JSON.parse(run.stdout) as { messages: { ruleId: string | null }[] }[];
  const counts: Record<string, number> = {};
  for (const message of files.flatMap((file) => file.messages)) counts[message.ruleId ?? 'sem-regra'] = (counts[message.ruleId ?? 'sem-regra'] ?? 0) + 1;
  return counts;
}

async function main(): Promise<void> {
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor !== REQUIRED_NODE_MAJOR) throw new Error(`a medição vale só em Node ${REQUIRED_NODE_MAJOR}; este é ${process.version}`);
  const limits = readLimits();
  const report = {
    node: process.version, machine: { cpu: cpus()[0]?.model ?? 'desconhecida', cores: cpus().length, platform: platform() }, limits,
    ...countSourceLines(), ...(await measureBrotli()), ...measureCompileMilliseconds(), lintViolations: countLintViolations(),
  };
  const verdict = {
    sourceLines: report.sourceLines <= limits.maxSourceLines,
    brotliBytes: report.brotliBytes <= limits.maxBrotliBytes,
    compileMilliseconds: report.medianMs <= limits.maxMillisecondsFor10kLines,
  };
  writeFileSync(REPORT_PATH, `${JSON.stringify({ ...report, verdict }, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ ...report, runsMs: undefined, verdict }, null, 2)}\n`);
}

await main();
