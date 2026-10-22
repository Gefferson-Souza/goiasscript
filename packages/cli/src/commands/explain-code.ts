import { DIAGNOSTICS } from '@goiasscript/language';
import { editDistance } from '../args/edit-distance.ts';
import { CODE_PREFIX, EXPLAIN_CODE_PATTERN, MAX_CODE_SUGGESTION_DISTANCE } from './explain.constants.ts';

export function normalizeDiagnosticCode(typed: string): string | null {
  const digits = EXPLAIN_CODE_PATTERN.exec(typed.trim())?.[1];
  return digits === undefined ? null : `${CODE_PREFIX}${digits}`;
}

export function suggestDiagnosticCode(typed: string): string | null {
  const candidate = typed.trim().toUpperCase();
  if (!/\d/u.test(candidate)) return null;
  const closest = DIAGNOSTICS.map((definition) => ({ code: definition.code, distance: editDistance(candidate, definition.code) }))
    .sort((first, second) => first.distance - second.distance)[0];
  return closest !== undefined && closest.distance <= MAX_CODE_SUGGESTION_DISTANCE ? closest.code : null;
}
