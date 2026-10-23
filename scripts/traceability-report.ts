import type { GateProblem, TraceabilityEntry } from './gate.types.ts';
import { README_PATH, SOURCED_NUMBER_CLAIM, SOURCE_MARKER } from './traceability-report.constants.ts';

const INLINE_CODE = /`([^`]+)`/gu;
const FENCE = /^```\s*(\S*)/u;
const SHELL_FENCES: readonly string[] = ['bash', 'sh', 'shell', 'console'];
const INSTALL_COMMAND = 'npm install --global goiasscript';
const CLI_PREFIX = 'goiasscript ';
const REPL_COMMAND = 'goias';
const SECTION_TITLES = { green: 'green', ready: 'ready', missing: 'missing' } as const;

function claimKey(code: string): string | undefined {
  const text = code.trim();
  if (text === REPL_COMMAND || text === INSTALL_COMMAND) return text;
  if (!text.startsWith(CLI_PREFIX)) return undefined;
  return text.split(/\s+/u).slice(0, 2).join(' ');
}

interface ScanState {
  readonly fence: string | undefined;
  readonly codes: readonly string[];
}

function scanLine(state: ScanState, line: string): ScanState {
  const opened = FENCE.exec(line);
  if (opened !== null) return { ...state, fence: state.fence === undefined ? (opened[1] ?? '') : undefined };
  if (state.fence === undefined) {
    return { ...state, codes: [...state.codes, ...Array.from(line.matchAll(INLINE_CODE), (match) => match[1] ?? '')] };
  }
  return SHELL_FENCES.includes(state.fence) ? { ...state, codes: [...state.codes, line] } : state;
}

function candidateCodes(readme: string): readonly string[] {
  return readme.split('\n').reduce<ScanState>(scanLine, { fence: undefined, codes: [] }).codes;
}

export function readmeClaims(readme: string): readonly string[] {
  const keys = candidateCodes(readme).map(claimKey);
  return [...new Set(keys.filter((key): key is string => key !== undefined))];
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
