import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUMP_ORDER, CONFORMANCE_DIR, GITHUB_WARNING_PREFIX, LOCK_FILE, STABLE_V3_TAG } from './compat-check.constants.ts';
import { compile } from '../packages/compiler/src/index.ts';
import { createGitPort, readChangesets } from './compat-ports.ts';
import { processIo } from './gate-report.ts';
import type { GateIo } from './gate.types.ts';
import type { BumpKind, BumpRequirement, Changeset, CompatDeps, CompatResult, CompileFn, GitPort, LockDiagnostic, ReplayResult, VocabularyLock } from './compat-check.types.ts';

const rank = (bump: BumpKind): number => BUMP_ORDER.indexOf(bump);
const maxBump = (left: BumpKind, right: BumpKind): BumpKind => (rank(left) >= rank(right) ? left : right);

function reservedChanges(previous: VocabularyLock, next: VocabularyLock): readonly (readonly [BumpKind, string])[] {
  const before = new Set(previous.reserved.map((entry) => entry.name));
  const after = new Set(next.reserved.map((entry) => entry.name));
  return [
    ...[...before].filter((name) => !after.has(name)).map((name) => ['major', `palavra reservada removida ou renomeada: ${name}`] as const),
    ...[...after].filter((name) => !before.has(name)).map((name) => ['major', `palavra reservada nova: ${name}`] as const),
  ];
}

function diagnosticChange(previous: ReadonlyMap<string, LockDiagnostic>, current: LockDiagnostic): readonly [BumpKind, string] | null {
  const old = previous.get(current.code);
  if (old === undefined) {
    return current.severity === 'error' ? ['major', `diagnóstico novo com severidade error: ${current.code}`] : ['minor', `aviso novo: ${current.code}`];
  }
  if (old.severity === current.severity) return null;
  return ['major', `código ${current.code} mudou de ${old.severity} para ${current.severity}`];
}

export function requiredBump(previous: VocabularyLock, next: VocabularyLock): BumpRequirement {
  const known = new Map(previous.diagnostics.map((entry) => [entry.code, entry]));
  const changes = [...reservedChanges(previous, next), ...next.diagnostics.map((entry) => diagnosticChange(known, entry)).filter((change) => change !== null)];
  return { bump: changes.reduce<BumpKind>((acc, [bump]) => maxBump(acc, bump), 'none'), reasons: changes.map(([, reason]) => reason) };
}

export function pendingBump(changesets: readonly Changeset[]): BumpKind {
  return changesets.flatMap((entry) => Object.values(entry.releases)).reduce<BumpKind>(maxBump, 'none');
}

function isOkGolden(diagnosticsJson: string | null): boolean {
  if (diagnosticsJson === null) return false;
  const parsed: unknown = JSON.parse(diagnosticsJson);
  return Array.isArray(parsed) && parsed.every((entry: { readonly severity?: string }) => entry.severity === 'warning');
}

function isExpectedFail(caseJson: string | null): boolean {
  return caseJson !== null && (JSON.parse(caseJson) as { readonly status?: string }).status === 'expected-fail';
}

async function replayCase(previousTag: string, id: string, compile: CompileFn, git: GitPort): Promise<ReplayResult | null> {
  const base = `${CONFORMANCE_DIR}/${id}`;
  const [input, diagnostics, config] = await Promise.all([git.readFile(previousTag, `${base}/input.gs`), git.readFile(previousTag, `${base}/diagnostics.json`), git.readFile(previousTag, `${base}/case.json`)]);
  if (input === null || !isOkGolden(diagnostics) || isExpectedFail(config)) return null;
  return { id, nowFails: !compile(input).ok };
}

export async function replayOkCases(previousTag: string, compile: CompileFn, git: GitPort): Promise<readonly ReplayResult[]> {
  const files = await git.listFiles(previousTag, CONFORMANCE_DIR);
  const ids = [...new Set(files.map((file) => file.slice(CONFORMANCE_DIR.length + 1).split('/')[0] ?? ''))].filter((id) => id !== '').sort();
  const results = await Promise.all(ids.map((id) => replayCase(previousTag, id, compile, git)));
  return results.filter((result) => result !== null);
}

export function previousStableTag(tags: readonly string[], currentTag: string | null): string | null {
  const parsed = tags
    .filter((tag) => tag !== currentTag)
    .map((tag) => ({ tag, match: STABLE_V3_TAG.exec(tag) }))
    .filter((entry) => entry.match !== null)
    .map((entry) => ({ tag: entry.tag, minor: Number(entry.match?.[1]), patch: Number(entry.match?.[2]) }));
  const sorted = [...parsed].sort((left, right) => right.minor - left.minor || right.patch - left.patch);
  return sorted[0]?.tag ?? null;
}

function insufficient(required: BumpKind, pending: BumpKind): boolean {
  return rank(pending) < rank(required);
}

export async function runCompatCheck(deps: CompatDeps): Promise<CompatResult> {
  const previousTag = previousStableTag(await deps.git.listTags(), deps.currentTag);
  if (previousTag === null) {
    return { ok: true, failures: [], warnings: ['Ainda não tem tag estável v3.x.y anterior pra comparar, então o compat passou sem conferir nada. A primeira comparação de verdade é na 3.0.1.'] };
  }
  const previousText = await deps.git.readFile(previousTag, LOCK_FILE);
  if (previousText === null) {
    return { ok: true, failures: [], warnings: [`A tag ${previousTag} não tem ${LOCK_FILE}; o compat passou sem conferir o vocabulário.`] };
  }
  const pending = pendingBump(deps.changesets);
  const required = requiredBump(JSON.parse(previousText) as VocabularyLock, deps.currentLock);
  const broken = (await replayOkCases(previousTag, deps.compile, deps.git)).filter((result) => result.nowFails);
  const failures = [
    ...(insufficient(required.bump, pending) ? [`Ô rapaz! A mudança pede bump ${required.bump}, mas o changeset pendente é ${pending}: ${required.reasons.join('; ')}.`] : []),
    ...(broken.length > 0 && insufficient('major', pending) ? [`Eita! ${String(broken.length)} caso(s) que compilavam na ${previousTag} agora dão erro e não tem changeset major: ${broken.map((result) => result.id).join(', ')}.`] : []),
  ];
  return { ok: failures.length === 0, failures, warnings: [] };
}

export async function runCompatCli(root: string, io: GateIo, currentTag: string | null): Promise<number> {
  const currentLock = JSON.parse(fs.readFileSync(path.join(root, LOCK_FILE), 'utf8')) as VocabularyLock;
  const result = await runCompatCheck({ git: createGitPort(root), currentTag, currentLock, changesets: readChangesets(root), compile });
  for (const warning of result.warnings) io.out(`${GITHUB_WARNING_PREFIX}${warning}\n`);
  for (const failure of result.failures) io.err(`${failure}\n`);
  if (result.ok) io.out('Tá pronto, sô! O compat conferiu o vocabulário e os casos da tag anterior.\n');
  return result.ok ? 0 : 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tag = process.env['GITHUB_REF_TYPE'] === 'tag' ? (process.env['GITHUB_REF_NAME'] ?? null) : null;
  process.exit(await runCompatCli(path.resolve(import.meta.dirname, '..'), processIo, tag));
}
