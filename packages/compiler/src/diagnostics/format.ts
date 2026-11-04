import { diagnosticTexts, lookupDiagnostic } from '@goiasscript/language';
import type { CompileResult, CoreCompileResult, CoreDiagnostic, Diagnostic, Tone } from '../api.types.ts';

export function formatDiagnostic(core: CoreDiagnostic, tone: Tone): Diagnostic {
  const definition = lookupDiagnostic(core.code);
  if (definition === undefined) return { code: core.code, severity: 'error', range: core.range, message: core.code };
  const lesson = core.lesson === undefined ? definition.lesson : (core.lesson ?? undefined);
  const texts = diagnosticTexts(definition, tone, core.args);
  return {
    code: core.code,
    severity: definition.severity,
    range: core.range,
    message: texts.message,
    ...(texts.help === undefined ? {} : { help: texts.help }),
    ...(lesson === undefined ? {} : { lesson }),
  };
}

export function formatCompileResult(result: CoreCompileResult, tone: Tone): CompileResult {
  const diagnostics = result.diagnostics.map((diagnostic) => formatDiagnostic(diagnostic, tone));
  return { ...result, diagnostics };
}
