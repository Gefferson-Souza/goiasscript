import { DIAGNOSTICS } from '../src/diagnostics/index.ts';
import type { GeneratedFile } from './generators.types.ts';

const RUNTIME_PHRASE_CODES = ['GS0701', 'GS0702', 'GS0703', 'GS0710', 'GS0711', 'GS0712', 'GS0713'] as const;

export function renderCoreDiagnosticsFiles(): readonly GeneratedFile[] {
  const warnings = DIAGNOSTICS.filter((entry) => entry.severity === 'warning').map((entry) => JSON.stringify(entry.code));
  const phrases = RUNTIME_PHRASE_CODES.map((code) => {
    const definition = DIAGNOSTICS.find((entry) => entry.code === code);
    if (definition === undefined) throw new Error(`diagnóstico ausente: ${code}`);
    return `  ${code}: ${JSON.stringify(definition.messages.raiz)},`;
  });
  const header = '// Gerado por generators/core-diagnostics.ts a partir do catálogo de diagnósticos; não editar.';
  const content = [
    header,
    `export const WARNING_CODES: ReadonlySet<string> = new Set([${warnings.join(', ')}]);`,
    'export const RUNTIME_PHRASES: Readonly<Record<string, string>> = {',
    ...phrases,
    '};',
    '',
  ].join('\n');
  return [{ path: 'packages/language/src/diagnostics/core.generated.ts', content }];
}
