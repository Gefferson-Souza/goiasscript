import type { DiagnosticDefinition, DiagnosticTexts, ToneKey } from './diagnostics.types.ts';
import { formatMessage } from '../format-message.ts';
import { VARIANT_ARG } from './diagnostic-texts.constants.ts';

// A variante pedida pelo compilador troca manchete e ajuda; sem variante conhecida vale o texto base.
export function diagnosticTexts(definition: DiagnosticDefinition, tone: ToneKey, args: Readonly<Record<string, string>>): DiagnosticTexts {
  const variant = definition.variants?.[args[VARIANT_ARG] ?? ''];
  const messages = variant?.messages ?? definition.messages;
  const help = variant === undefined ? definition.help : variant.help;
  const helpText = help?.[tone];
  return { message: formatMessage(messages[tone], args), ...(helpText === undefined ? {} : { help: formatMessage(helpText, args) }) };
}
