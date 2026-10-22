import type { DiagnosticExplanation } from '@goiasscript/compiler';
import { CODE_COLUMN_GAP, EXAMPLE_INDENT, EXPLAIN_HEADINGS, NO_LESSON_FALLBACK } from './explain.constants.ts';

const indentLines = (text: string): string =>
  text.split('\n').map((line) => `${EXAMPLE_INDENT}${line}`).join('\n');

export function renderExplanation(explanation: DiagnosticExplanation): string {
  const sections = [
    `${explanation.code}${CODE_COLUMN_GAP}${explanation.title}`,
    explanation.explanation,
    `${EXPLAIN_HEADINGS.example}\n${indentLines(explanation.example)}`,
    `${EXPLAIN_HEADINGS.lesson} ${explanation.lesson === '' ? NO_LESSON_FALLBACK : explanation.lesson}`,
  ];
  return `${sections.join('\n\n')}\n`;
}

export function renderListing(entries: readonly { readonly code: string; readonly title: string }[], hint: string): string {
  const lines = entries.map((entry) => `${entry.code}${CODE_COLUMN_GAP}${entry.title}`);
  return `${[...lines, '', hint].join('\n')}\n`;
}
