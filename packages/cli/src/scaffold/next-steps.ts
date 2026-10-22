import type { Tone } from '@goiasscript/compiler';
import { chooseByTone } from '../tone-choice.ts';
import { NEXT_STEPS_HEADING, NEXT_STEPS_INDENT, RUN_COMMAND, SCAFFOLD_SUCCESS } from './template.constants.ts';

export function renderSuccess(name: string, tone: Tone): string {
  const steps = [`cd ${name}`, RUN_COMMAND].map((step) => `${NEXT_STEPS_INDENT}${step}`);
  const headline = chooseByTone(tone, SCAFFOLD_SUCCESS.root, SCAFFOLD_SUCCESS.neutral);
  return [headline, NEXT_STEPS_HEADING, ...steps].join('\n') + '\n';
}

export function extractNextSteps(stdout: string): readonly string[] {
  const lines = stdout.split('\n');
  const start = lines.indexOf(NEXT_STEPS_HEADING);
  if (start === -1) return [];
  return lines
    .slice(start + 1)
    .filter((line) => line.startsWith(NEXT_STEPS_INDENT))
    .map((line) => line.trim());
}
