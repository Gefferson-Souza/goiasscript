import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CHECK_COMMAND,
  DEMO_DIR,
  DEMO_ENTRY_FILE,
  JSON_INDENT,
  MESSAGES,
  MIN_SECRET_LENGTH,
  OUT_FLAG,
  RUN_COMMAND,
  SCAFFOLD_COMMAND,
  SECRET_ENV_NAME,
  STDIN_MARKER,
  SUCCESS_MESSAGE,
  TESTS_FROM_FLAG,
  TRANSLATE_COMMAND,
  VAR_KEYWORD_SOURCE,
  ENGOIANADOR_SAMPLE_TEXT,
} from './video-facts.constants.ts';
import type { CliRun, EngoianadorFact, VideoFacts, VideoFactsArgs, VideoFactsDeps, VideoFactsIo } from './video-facts.types.ts';

interface RunOptions {
  readonly argv: readonly string[];
  readonly root: string;
  readonly env: Readonly<Record<string, string | undefined>>;
  readonly deps: VideoFactsDeps;
  readonly io: VideoFactsIo;
  readonly writeFile: (file: string, text: string) => void;
}

async function collectDemoRuns(deps: VideoFactsDeps): Promise<readonly CliRun[]> {
  const scaffold = await deps.runCli([SCAFFOLD_COMMAND, DEMO_DIR]);
  const run = await deps.runCli([RUN_COMMAND, DEMO_ENTRY_FILE], { cwd: DEMO_DIR });
  const check = await deps.runCli([CHECK_COMMAND, DEMO_ENTRY_FILE], { cwd: DEMO_DIR });
  return [scaffold, run, check];
}

async function collectVarKeywordToLet(deps: VideoFactsDeps): Promise<VideoFacts['varKeywordToLet']> {
  const translated = await deps.runCli([TRANSLATE_COMMAND, STDIN_MARKER], { stdin: VAR_KEYWORD_SOURCE });
  if (translated.exitCode !== 0) throw new Error(`${MESSAGES.translateFailed} (${translated.command}): ${translated.stderr.trim()}`);
  return { before: VAR_KEYWORD_SOURCE, after: translated.stdout };
}

async function collectEngoianador(deps: VideoFactsDeps): Promise<EngoianadorFact> {
  if (deps.fetchEngoianador === null) return { status: 'pending-owner' };
  const response = await deps.fetchEngoianador(ENGOIANADOR_SAMPLE_TEXT);
  return { status: 'ok', request: ENGOIANADOR_SAMPLE_TEXT, response };
}

export async function collectVideoFacts(deps: VideoFactsDeps): Promise<VideoFacts> {
  const [version, tests, cli, varKeywordToLet, engoianador] = await Promise.all([
    deps.readVersion(),
    deps.countTests(),
    collectDemoRuns(deps),
    collectVarKeywordToLet(deps),
    collectEngoianador(deps),
  ]);
  return { generatedAt: deps.now().toISOString(), version, tests, cli, varKeywordToLet, engoianador };
}

export function assertOutsideRepository(out: string, root: string): void {
  const relative = path.relative(path.resolve(root), path.resolve(out));
  const inside = relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  if (inside) throw new Error(MESSAGES.insideRepository);
}

export function serializeVideoFacts(facts: VideoFacts, env: Readonly<Record<string, string | undefined>>): string {
  const text = `${JSON.stringify(facts, null, JSON_INDENT)}\n`;
  const leaked = Object.entries(env).some(
    ([name, value]) => SECRET_ENV_NAME.test(name) && value !== undefined && value.length >= MIN_SECRET_LENGTH && text.includes(value),
  );
  if (leaked) throw new Error(MESSAGES.secretLeak);
  return text;
}

export function parseVideoFactsArgs(argv: readonly string[]): VideoFactsArgs {
  const valueOf = (flag: string): string | null => {
    const index = argv.indexOf(flag);
    return index === -1 ? null : (argv[index + 1] ?? null);
  };
  const out = valueOf(OUT_FLAG);
  if (out === null) throw new Error(MESSAGES.missingOut);
  return { out, testsFrom: valueOf(TESTS_FROM_FLAG) };
}

export async function runVideoFacts(options: RunOptions): Promise<number> {
  try {
    const args = parseVideoFactsArgs(options.argv);
    assertOutsideRepository(args.out, options.root);
    const facts = await collectVideoFacts(options.deps);
    options.writeFile(path.resolve(args.out), serializeVideoFacts(facts, options.env));
    options.io.out(`${SUCCESS_MESSAGE}\n`);
    return 0;
  } catch (error) {
    options.io.err(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { createRealVideoFactsRuntime } = await import('./video-facts-ports.ts');
  const root = path.resolve(import.meta.dirname, '..');
  const argv = process.argv.slice(2);
  const runtime = createRealVideoFactsRuntime(root, process.env, () => parseVideoFactsArgs(argv).testsFrom);
  const code = await runVideoFacts({
    argv,
    root,
    env: process.env,
    deps: runtime.deps,
    io: { out: (text) => process.stdout.write(text), err: (text) => process.stderr.write(text) },
    writeFile: (file, text) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, text);
    },
  });
  runtime.dispose();
  process.exit(code);
}
