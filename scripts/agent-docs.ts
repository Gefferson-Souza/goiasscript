import fs from 'node:fs';
import path from 'node:path';

const CODE_SPAN = /`([^`\n]+)`/g;
const PNPM_COMMAND = /^(?:corepack )?pnpm (?:run )?([a-z][\w:-]*)/;
const PNPM_BUILTINS = new Set(['install', 'add', 'exec', 'dlx', 'remove', 'update', 'why', 'list', 'audit', 'outdated']);
const PATH_LIKE = /^\.?[\w@-][\w.@-]*(?:\/[\w.@-]+)+\/?$/;
const FILE_LIKE = /^[\w-][\w.-]*\.(?:md|json|js|mjs|cjs|ts|mts|yml|yaml|gs)$/;
const PACKAGE_NAME = /^@goiasscript\/([\w-]+)$/;
const NOT_A_PATH = /[*<>\s]/;
const MAX_CLAUDE_LINES = 200;
const WORKSPACE_ROOTS = ['packages', 'tools'];

function rootScripts(root: string): ReadonlySet<string> {
  const manifest: unknown = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const scripts = typeof manifest === 'object' && manifest !== null && 'scripts' in manifest ? manifest.scripts : {};
  return new Set(Object.keys(typeof scripts === 'object' && scripts !== null ? scripts : {}));
}

function workspaceNames(root: string): ReadonlySet<string> {
  return new Set(WORKSPACE_ROOTS.flatMap((group) => (fs.existsSync(path.join(root, group)) ? fs.readdirSync(path.join(root, group)) : [])));
}

function problemsInSpan(span: string, root: string, scripts: ReadonlySet<string>, workspaces: ReadonlySet<string>): readonly string[] {
  const pnpm = PNPM_COMMAND.exec(span)?.[1];
  if (pnpm !== undefined) return PNPM_BUILTINS.has(pnpm) || scripts.has(pnpm) ? [] : [`script "${pnpm}" não existe no package.json`];
  const packageName = PACKAGE_NAME.exec(span)?.[1];
  if (packageName !== undefined) return workspaces.has(packageName) ? [] : [`pacote "${span}" não existe no workspace`];
  const isPath = !NOT_A_PATH.test(span) && (PATH_LIKE.test(span) || FILE_LIKE.test(span));
  return isPath && !fs.existsSync(path.join(root, span)) ? [`caminho "${span}" não existe`] : [];
}

export function findAgentDocProblems(root: string, docs: readonly string[]): readonly string[] {
  const scripts = rootScripts(root);
  const workspaces = workspaceNames(root);
  return docs.flatMap((doc) => {
    if (!fs.existsSync(path.join(root, doc))) return [`${doc}: arquivo não existe`];
    const text = fs.readFileSync(path.join(root, doc), 'utf8');
    const spans = [...text.matchAll(CODE_SPAN)].map((match) => match[1] ?? '');
    const sizeProblem = doc === 'CLAUDE.md' && text.split('\n').length >= MAX_CLAUDE_LINES ? [`CLAUDE.md precisa ter menos de ${String(MAX_CLAUDE_LINES)} linhas`] : [];
    return [...sizeProblem, ...spans.flatMap((span) => problemsInSpan(span, root, scripts, workspaces))].map((problem) => `${doc}: ${problem}`);
  });
}
