import { DIAGNOSTICS } from './index.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

const DIAGNOSTICS_BY_CODE: ReadonlyMap<string, DiagnosticDefinition> = new Map(DIAGNOSTICS.map((entry) => [entry.code, entry]));

export const lookupDiagnostic = (code: string): DiagnosticDefinition | undefined => DIAGNOSTICS_BY_CODE.get(code);
