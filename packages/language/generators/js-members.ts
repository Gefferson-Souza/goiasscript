import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import type { GeneratedFile } from './generators.types.ts';

const BUILTIN_INTERFACES: ReadonlySet<string> = new Set([
  'Object', 'ObjectConstructor', 'Function', 'FunctionConstructor', 'Array', 'ArrayConstructor', 'ReadonlyArray', 'String',
  'StringConstructor', 'Number', 'NumberConstructor', 'Boolean', 'Math', 'JSON', 'Date', 'DateConstructor', 'RegExp', 'Error',
  'ErrorConstructor', 'Promise', 'PromiseConstructor', 'Map', 'Set', 'Symbol',
]);
const ALWAYS_NATIVE = ['__proto__'] as const;
export const JS_MEMBERS_PATH = 'packages/language/src/js/js-members.generated.ts';

function memberName(member: ts.TypeElement): string | undefined {
  const name = member.name;
  return name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name)) ? name.text : undefined;
}

export function collectJsMemberNames(): readonly string[] {
  const rootFile = fileURLToPath(new URL('./lib-root.d.ts', import.meta.url));
  const program = ts.createProgram({ rootNames: [rootFile], options: { lib: ['lib.es2023.d.ts'], target: ts.ScriptTarget.ESNext, types: [] } });
  const names = program.getSourceFiles().filter((file) => program.isSourceFileDefaultLibrary(file)).flatMap((file) =>
    file.statements.filter(ts.isInterfaceDeclaration).filter((declaration) => BUILTIN_INTERFACES.has(declaration.name.text))
      .flatMap((declaration) => declaration.members.map(memberName)));
  const defined = names.filter((name): name is string => name !== undefined);
  return [...new Set([...defined, ...ALWAYS_NATIVE])].toSorted();
}

export function renderJsMembers(names: readonly string[]): string {
  const body = names.map((name) => `  '${name}',`).join('\n');
  return `// Gerado por generators/js-members.ts a partir de lib.es2023.*.d.ts; não editar.\nexport const JS_MEMBER_NAMES = [\n${body}\n] as const;\n`;
}

export function renderJsMembersFiles(): readonly GeneratedFile[] {
  return [{ path: JS_MEMBERS_PATH, content: renderJsMembers(collectJsMemberNames()) }];
}
