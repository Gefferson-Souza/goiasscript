import { formatMessage, lookupDiagnostic } from '@goiasscript/language';
import type { CompileResult, CoreCompileResult, CoreDiagnostic, Diagnostic, Tone } from '../api.types.ts';

export function formatDiagnostic(core: CoreDiagnostic, tone: Tone): Diagnostic {
  const definition = lookupDiagnostic(core.code);
  if (definition === undefined) return { code: core.code, severity: 'error', range: core.range, message: core.code };
  const help = definition.help?.[tone];
  return {
    code: core.code,
    severity: definition.severity,
    range: core.range,
    message: formatMessage(definition.messages[tone], core.args),
    ...(help === undefined ? {} : { help: formatMessage(help, core.args) }),
    ...(definition.lesson === undefined ? {} : { lesson: definition.lesson }),
  };
}

export function formatCompileResult(result: CoreCompileResult, tone: Tone): CompileResult {
  const diagnostics = result.diagnostics.map((diagnostic) => formatDiagnostic(diagnostic, tone));
  return { ...result, diagnostics };
}
