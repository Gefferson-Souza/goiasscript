import { KEYWORDS } from '@goiasscript/language';
import type { AstNode } from '../ast/ast.types.ts';

const ASSIGN_JS = '=';
const CONSOLE_PREFIX = 'console.';

export const ASSIGN_SPELLING = KEYWORDS.find((entry) => entry.js === ASSIGN_JS)?.spelling ?? ASSIGN_JS;
export const ADD_OPERATOR = '+';
export const DECIMAL_COMMA_NUMBERS = /^\d{1,3}(\.\d{3})+,\d+$/u;
export const FALLBACK_CONSTRUCT = 'seta';
export const FOR_CONSTRUCT = 'vai_indo';
export const FUNCTION_TYPES: ReadonlySet<AstNode['type']> = new Set(['FunctionDeclaration', 'ArrowFunctionExpression', 'MethodDefinition']);
export const LOOP_TYPES: ReadonlySet<AstNode['type']> = new Set(['WhileStatement', 'ForStatement', 'ForOfStatement', 'ForInStatement']);
export const NO_EFFECT_TYPES: ReadonlySet<AstNode['type']> = new Set(['BinaryExpression', 'LogicalExpression', 'UnaryExpression', 'Identifier', 'Literal']);
export const isConsoleOutput = (js: string): boolean => js.startsWith(CONSOLE_PREFIX);
