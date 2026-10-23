import type { LessonSourceOptions } from './lesson-source.types.ts';

const FENCE = '```';

export const EXAMPLE_BLOCK = [`${FENCE}goiasscript exemplo`, 'prosa("Bão, sô!")', FENCE].join('\n');
export const STATIC_BLOCK = [`${FENCE}goiasscript`, 'prosa("Segundo")', FENCE].join('\n');

export function fenced(info: string, code: string): string {
  return [`${FENCE}${info}`, code, FENCE].join('\n');
}

function exerciseLines(options: LessonSourceOptions): readonly string[] {
  const lines = ['exercise:', '  prompt: "Imprime Olá, Goiás!"', '  starter: |', '    prosa("")', '  solution: |'];
  for (const line of (options.solution ?? 'prosa("Olá, Goiás!")').split('\n')) lines.push(`    ${line}`);
  if (options.expectedStdout !== null) lines.push(`  expectedStdout: ${JSON.stringify(options.expectedStdout ?? 'Olá, Goiás!')}`);
  if (options.stdinFile !== undefined) lines.push(`  stdinFile: ${JSON.stringify(options.stdinFile)}`);
  return lines;
}

export function lessonSource(options: LessonSourceOptions = {}): string {
  const front = ['---'];
  if (options.id !== null) front.push(`id: ${options.id ?? 'licao-01'}`);
  front.push(`order: ${String(options.order ?? 1)}`, 'title: Primeiro programa', 'summary: O primeiro trem que ocê escreve.');
  front.push(`terms: ${JSON.stringify(options.terms ?? ['prosa'])}`, ...exerciseLines(options), ...(options.extraKeys ?? []), '---');
  const blocks = options.blocks ?? [EXAMPLE_BLOCK, STATIC_BLOCK];
  return `${front.join('\n')}\n\n# Primeiro programa\n\nBão demais, sô!\n\n${blocks.join('\n\n')}\n`;
}
