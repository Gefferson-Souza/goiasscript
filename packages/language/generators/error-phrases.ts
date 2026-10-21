import { DIAGNOSTICS } from '../src/index.ts';
import type { GeneratedFile } from './generators.types.ts';

const ENGINE_ERROR_BY_CODE: Readonly<Record<string, string>> = {
  GS0710: 'TypeError', GS0711: 'ReferenceError', GS0712: 'RangeError', GS0713: 'SyntaxError', GS0714: 'Error',
};

export function renderErrorPhrasesFiles(): readonly GeneratedFile[] {
  const lines = Object.entries(ENGINE_ERROR_BY_CODE).map(([code, engineName]) => {
    const definition = DIAGNOSTICS.find((entry) => entry.code === code);
    if (definition === undefined) throw new Error(`diagnóstico ausente: ${code}`);
    return `  ${engineName}: ${JSON.stringify(definition.messages.raiz)},`;
  });
  const header = '// Gerado por generators/error-phrases.ts a partir de GS0710–GS0714; não editar.';
  const content = `${header}\nexport const ERROR_PHRASES: Readonly<Record<string, string>> = {\n${lines.join('\n')}\n};\n`;
  return [{ path: 'packages/language/generated/error-phrases.generated.ts', content }];
}
