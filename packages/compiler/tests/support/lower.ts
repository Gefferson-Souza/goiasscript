import { parse as acornParse } from 'acorn';
import { Script } from 'node:vm';
import { analyze } from '../../src/analyzer/analyzer.ts';
import type { CompileTarget, ReplSession } from '../../src/api.types.ts';
import { createLexer } from '../../src/lexer/lexer.ts';
import { parse } from '../../src/parser/parser.ts';
import { createSourceText } from '../../src/source/source-text.ts';
import { emitProgram } from '../../src/targets/module-target.ts';

const ECMA_VERSION = 2022;

export function emit(text: string, target: CompileTarget = 'module', loopLimit?: number, session?: ReplSession) {
  const source = createSourceText(text, 'programa.gs');
  const parsed = parse(source, createLexer(source), { target });
  const analysis = analyze(parsed.program, source, { target, ...(session === undefined ? {} : { session }) });
  const out = emitProgram(parsed.program, analysis, source, {
    target,
    ...(loopLimit === undefined ? {} : { loopLimit }),
    ...(session === undefined ? {} : { session }),
  });
  if (target === 'module') acornParse(out.code, { ecmaVersion: ECMA_VERSION, sourceType: 'module' });
  else new Script(out.code);
  return out;
}
