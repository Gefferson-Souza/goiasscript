import type { GateProblem, TraceabilityEntry } from './gate.types.ts';
import { README_PATH, SOURCED_NUMBER_CLAIM, SOURCE_MARKER } from './traceability-report.constants.ts';

const INLINE_CODE = /`([^`]+)`/gu;
const TABLE_FIRST_CELL = /^\|\s*([^|]+?)\s*\|/u;
const INSTALL_COMMAND = 'npm install --global goiasscript';
const CLI_PREFIX = 'goiasscript ';
const REPL_COMMAND = 'goias';
const SECTION_TITLES = { green: 'green', ready: 'ready', missing: 'missing' } as const;

function claimKey(code: string): string | undefined {
  if (code === REPL_COMMAND || code === INSTALL_COMMAND) return code;
  if (!code.startsWith(CLI_PREFIX)) return undefined;
  return code.split(/\s+/u).slice(0, 2).join(' ');
}

export function readmeClaims(readme: string): readonly string[] {
  const keys = readme.split('\n').flatMap((line) => {
    const cell = TABLE_FIRST_CELL.exec(line)?.[1] ?? '';
    return Array.from(cell.matchAll(INLINE_CODE), (match) => claimKey(match[1] ?? ''));
  });
  const installed = readme.includes(INSTALL_COMMAND) ? [INSTALL_COMMAND] : [];
  return [...new Set([...keys, ...installed].filter((key): key is string => key !== undefined))];
}

export function readmeProblems(readme: string, entries: readonly TraceabilityEntry[]): readonly GateProblem[] {
  const covered = new Set(entries.flatMap((entry) => entry.covers ?? []));
  const uncovered = readmeClaims(readme).filter((claim) => !covered.has(claim));
  const unsourced = readme.split('\n').filter((line) => SOURCED_NUMBER_CLAIM.test(line) && !line.includes(SOURCE_MARKER));
  return [
    ...uncovered.map((claim) => ({ file: README_PATH, message: `a afirmação "${claim}" não tem prova na tabela de rastreabilidade.` })),
    ...unsourced.map((line) => ({ file: README_PATH, message: `o número de testes em "${line.trim()}" não aponta para a fonte.` })),
  ];
}

function section(title: string, entries: readonly TraceabilityEntry[], detail: (entry: TraceabilityEntry) => readonly string[]): string {
  const lines = entries.flatMap((entry) => [`  - ${entry.promise}`, ...detail(entry).map((text) => `      ${text}`)]);
  return [`${title} (${String(entries.length)})`, ...lines].join('\n');
}

const ownerDetail = (entry: TraceabilityEntry): readonly string[] => [
  ...entry.proofs.filter((proof) => proof.kind !== 'test').map((proof) => `prova: ${proof.path}`),
  `comando do dono: ${entry.ownerCommand ?? 'nenhum registrado'}`,
];

export function renderReport(entries: readonly TraceabilityEntry[]): string {
  const by = (state: TraceabilityEntry['state']): readonly TraceabilityEntry[] => entries.filter((entry) => entry.state === state);
  return `${[
    section(SECTION_TITLES.green, by('green'), () => []),
    section(SECTION_TITLES.ready, by('ready'), ownerDetail),
    section(SECTION_TITLES.missing, by('missing'), () => []),
  ].join('\n\n')}\n`;
}
