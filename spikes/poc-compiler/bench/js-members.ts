import ts from 'typescript';

type Receiver = readonly [label: string, declaredType: string];

const VIRTUAL_FILE = 'js-members.virtual.ts';
const SYMBOL_KEY_PREFIX = '__@';
const RECEIVERS: readonly Receiver[] = [
  ['Array', 'unknown[]'], ['String', 'string'], ['Object', 'Object'], ['Promise', 'Promise<unknown>'], ['Number', 'number'],
  ['Date', 'Date'], ['Error', 'Error'], ['Array (estático)', 'ArrayConstructor'], ['Object (estático)', 'ObjectConstructor'],
  ['Promise (estático)', 'PromiseConstructor'], ['Number (estático)', 'NumberConstructor'], ['String (estático)', 'StringConstructor'],
  ['Date (estático)', 'DateConstructor'], ['Error (estático)', 'ErrorConstructor'], ['Math', 'Math'], ['JSON', 'JSON'],
];
const COMPILER_OPTIONS: ts.CompilerOptions = { lib: ['lib.es2023.d.ts'], target: ts.ScriptTarget.ES2023, types: [], noEmit: true };

const virtualSource = (): string => RECEIVERS.map(([, declaredType], index) => `declare const receiver${index}: ${declaredType};`).join('\n');

const createHost = (): ts.CompilerHost => {
  const host = ts.createCompilerHost(COMPILER_OPTIONS);
  const source = ts.createSourceFile(VIRTUAL_FILE, virtualSource(), ts.ScriptTarget.ES2023);
  return {
    ...host,
    fileExists: (name) => name === VIRTUAL_FILE || host.fileExists(name),
    getSourceFile: (name, ...rest) => (name === VIRTUAL_FILE ? source : host.getSourceFile(name, ...rest)),
  };
};

// A lista vem do lib.es2023.d.ts do TypeScript fixado, nunca do motor, que muda entre versões do Node.
export const listJsMembers = (): ReadonlyMap<string, readonly string[]> => {
  const program = ts.createProgram([VIRTUAL_FILE], COMPILER_OPTIONS, createHost());
  const checker = program.getTypeChecker();
  const statements: readonly ts.Statement[] = program.getSourceFile(VIRTUAL_FILE)?.statements ?? [];
  const declarations = statements.filter(ts.isVariableStatement);
  const entries = declarations.map((statement, index): [string, readonly string[]] => {
    const declaration = statement.declarationList.declarations[0];
    const symbol = declaration ? checker.getSymbolAtLocation(declaration.name) : undefined;
    const type = symbol && declaration ? checker.getApparentType(checker.getTypeOfSymbolAtLocation(symbol, declaration)) : undefined;
    const names = (type ? checker.getPropertiesOfType(type) : []).map((property) => property.getName());
    const label = RECEIVERS[index]?.[0] ?? '';
    return [label, names.filter((name) => !name.startsWith(SYMBOL_KEY_PREFIX)).toSorted()];
  });
  return new Map(entries);
};
