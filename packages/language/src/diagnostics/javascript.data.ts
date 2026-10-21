import { defineDiagnostic as d, tones as t } from './define-diagnostic.ts';
import type { DiagnosticDefinition } from './diagnostics.types.ts';

export const JAVASCRIPT_DIAGNOSTICS: readonly DiagnosticDefinition[] = [
  d('GS0401', 'error', 'Keyword do JavaScript', t('Ô sô, "{name}" é palavra do JavaScript. Aqui em GoiásScript a gente fala "{suggestion}".', '"{name}" é do JavaScript. Em GoiásScript, use "{suggestion}".'), 'const x é 1', { lesson: 'licao-02' }),
  d('GS0402', 'error', 'Palavra do JavaScript sem equivalente', t('Ô sô, "{name}" é palavra do JavaScript e não serve de nome; que tal "{suggestion}"?', '"{name}" é palavra do JavaScript e não serve de nome; use outro, como "{suggestion}".'), 'uai public é 1'),
  d('GS0403', 'error', 'Global do JavaScript', t('Ô sô, "{name}" é do JavaScript.[[ Aqui a gente fala "{suggestion}".]]', '"{name}" é um recurso do JavaScript.[[ Em GoiásScript, use "{suggestion}".]]'), 'console.log(1)'),
  d('GS0404', 'error', 'Operador do JavaScript', t('Ô sô, "{name}" é do JavaScript. Aqui a gente fala "{suggestion}".', '"{name}" é um operador do JavaScript. Em GoiásScript, use "{suggestion}".'), 'uai x = 1'),
  d('GS0405', 'error', 'Membro do JavaScript com nome goiano', t('Ô sô, ".{name}" é do JavaScript. Em goianês é ".{suggestion}".', '".{name}" é do JavaScript. Em GoiásScript, use ".{suggestion}".'), 'uai l é [1]\nl.map(x => x)'),
  d('GS0406', 'error', 'Membro do JavaScript sem nome goiano', t('Ô sô, ".{name}" é do JavaScript e esse trem ainda não tem nome goiano por aqui.[[ Que tal "{alternative}"?]]', '".{name}" é um recurso do JavaScript que ainda não tem nome em GoiásScript.[[ Considere "{alternative}".]]'), 'uai l é [1]\nl.toString()'),
];
