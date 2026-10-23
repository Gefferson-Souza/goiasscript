import { readFileSync } from 'node:fs';

const EXAMPLES_DIR = new URL('../../../playground/examples/', import.meta.url);
const LINE_MARK = /^[›!]\s?/u;

export const readGoldenStdout = (exampleId: string): string => readFileSync(new URL(`${exampleId}.stdout.txt`, EXAMPLES_DIR), 'utf8');

// Cada linha do painel de saída vem precedida de um marcador visual (› ou !).
export const plainOutputLines = (panelText: string): string =>
  panelText
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.replace(LINE_MARK, ''))
    .join('\n');
