import { MESSAGES, TESTS_REPORT_FIELD } from './video-facts.constants.ts';

export function countTestsFromReport(json: string): number {
  const report = JSON.parse(json) as Readonly<Record<string, unknown>>;
  const count = report[TESTS_REPORT_FIELD];
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 0) throw new Error(MESSAGES.invalidReport);
  return count;
}
